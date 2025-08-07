import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const trainerId = searchParams.get('trainerId');
    const date = searchParams.get('date');

    let queryText = `
      SELECT a.id, a.user_id, a.user_name, a.user_email, 
             a.trainer_id, a.trainer_name, a.appointment_date, 
             a.appointment_time, a.status, a.product_id, a.notes,
             p.name as product_name, p.points as product_points
      FROM appointments a
      LEFT JOIN products p ON a.product_id = p.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (userId) {
      params.push(userId);
      queryText += ` AND a.user_id = $${params.length}`;
    }

    if (trainerId) {
      params.push(trainerId);
      queryText += ` AND a.trainer_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      queryText += ` AND a.appointment_date = $${params.length}`;
    }

    queryText += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const result = await query(queryText, params);

    return NextResponse.json({ appointments: result.rows });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      userName, 
      userEmail, 
      trainerId, 
      trainerName, 
      date, 
      time, 
      productId,
      notes 
    } = await request.json();

    // Start a transaction
    const client = await (await import('../../../lib/database')).getClient();
    
    try {
      await client.query('BEGIN');

      // Insert the appointment
      const appointmentResult = await client.query(`
        INSERT INTO appointments (
          user_id, user_name, user_email, trainer_id, trainer_name,
          appointment_date, appointment_time, status, product_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8, $9)
        RETURNING id
      `, [userId, userName, userEmail, trainerId, trainerName, date, time, productId, notes]);

      const appointmentId = appointmentResult.rows[0].id;

      // Log the booking action
      await client.query(`
        INSERT INTO appointment_logs (
          appointment_id, action, action_by, action_by_name, action_by_role,
          appointment_date, appointment_time, trainer_id, trainer_name,
          user_id, user_name, user_email, product_id
        ) VALUES ($1, 'booked', $2, $3, 'user', $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        appointmentId, userId, userName, date, time, 
        trainerId, trainerName, userId, userName, userEmail, productId
      ]);

      await client.query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        appointmentId: appointmentId 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}