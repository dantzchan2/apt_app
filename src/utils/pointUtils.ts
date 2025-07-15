interface PointBatch {
  id: string;
  points: number;
  purchaseDate: string;
  expiryDate: string;
  originalPoints: number;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'trainer' | 'admin';
  points?: number;
  pointBatches?: PointBatch[];
  id: string;
  memo?: string;
}

export const cleanupExpiredPoints = (userData: UserData): UserData => {
  if (!userData.pointBatches) return userData;
  
  const now = new Date();
  const validBatches = userData.pointBatches.filter((batch: PointBatch) => 
    new Date(batch.expiryDate) > now
  );
  
  const totalPoints = validBatches.reduce((sum: number, batch: PointBatch) => sum + batch.points, 0);
  
  return {
    ...userData,
    pointBatches: validBatches,
    points: totalPoints
  };
};

export const getExpiringPointsWarning = (userData: UserData) => {
  if (!userData?.pointBatches || userData.role === 'trainer') return null;
  
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
  
  const expiringBatches = userData.pointBatches.filter(batch => 
    new Date(batch.expiryDate) <= twoWeeksFromNow
  );
  
  if (expiringBatches.length === 0) return null;
  
  const expiringPoints = expiringBatches.reduce((sum, batch) => sum + batch.points, 0);
  
  return {
    points: expiringPoints,
    earliestExpiry: expiringBatches.reduce((earliest, batch) => 
      new Date(batch.expiryDate) < new Date(earliest.expiryDate) ? batch : earliest
    ).expiryDate
  };
};

export const initializeLegacyPoints = (userData: UserData): UserData => {
  if (!userData.pointBatches && userData.points) {
    const purchaseDate = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    
    const legacyBatch: PointBatch = {
      id: 'legacy-' + Date.now() + '-' + userData.id,
      points: userData.points,
      purchaseDate: purchaseDate,
      expiryDate: expiryDate.toISOString(),
      originalPoints: userData.points
    };
    
    return {
      ...userData,
      pointBatches: [legacyBatch]
    };
  }
  
  return userData;
};

export const deductPointsFromBatches = (batches: PointBatch[], pointsToDeduct: number): PointBatch[] => {
  const sortedBatches = [...batches].sort((a, b) => 
    new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
  );
  
  let remaining = pointsToDeduct;
  const updatedBatches: PointBatch[] = [];
  
  for (const batch of sortedBatches) {
    if (remaining <= 0) {
      updatedBatches.push(batch);
      continue;
    }
    
    if (batch.points <= remaining) {
      // Use entire batch
      remaining -= batch.points;
      // Don't add this batch as it's completely used
    } else {
      // Use partial batch
      updatedBatches.push({
        ...batch,
        points: batch.points - remaining
      });
      remaining = 0;
    }
  }
  
  return updatedBatches;
};

export const refundPointToBatches = (batches: PointBatch[]): PointBatch[] => {
  const now = new Date();
  const validBatches = batches.filter(batch => new Date(batch.expiryDate) > now);
  
  if (validBatches.length === 0) {
    // Create a new batch if no valid batches exist
    const refundDate = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    
    return [...batches, {
      id: 'refund-' + Date.now(),
      points: 1,
      purchaseDate: refundDate,
      expiryDate: expiryDate.toISOString(),
      originalPoints: 1
    }];
  }
  
  // Add to most recent valid batch
  const sortedBatches = [...validBatches].sort((a, b) => 
    new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
  );
  
  const mostRecentBatch = sortedBatches[0];
  
  return batches.map(batch => 
    batch.id === mostRecentBatch.id 
      ? { ...batch, points: batch.points + 1 }
      : batch
  );
};