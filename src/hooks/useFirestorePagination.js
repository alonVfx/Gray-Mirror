import { useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  limit,
  startAfter,
  endBefore,
  limitToLast
} from 'firebase/firestore';

/**
 * Custom hook for efficient Firestore pagination using cursors
 * 
 * @param {object} config - Configuration object
 * @param {string} config.collectionPath - Firestore collection path
 * @param {string} config.orderByField - Field to order by
 * @param {string} config.orderDirection - 'asc' or 'desc'
 * @param {number} config.pageSize - Number of documents per page
 * @param {object} config.whereConditions - Additional where conditions
 * 
 * @returns {object} Pagination utilities and state
 */
export const useFirestorePagination = ({
  collectionPath,
  orderByField = 'createdAt',
  orderDirection = 'desc',
  pageSize = 10,
  whereConditions = null
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [hasPrev, setHasPrev] = useState(false);
  const [error, setError] = useState(null);

  // Build base query
  const buildQuery = (cursor = null, cursorDirection = 'next') => {
    let q = query(collection(window.db || null, collectionPath));
    
    // Add where conditions if provided
    if (whereConditions) {
      Object.entries(whereConditions).forEach(([field, condition]) => {
        // This is simplified - you'd need to import the specific where functions
        // q = query(q, where(field, condition.operator, condition.value));
      });
    }
    
    // Add ordering
    q = query(q, orderBy(orderByField, orderDirection));
    
    // Add cursor constraint
    if (cursor) {
      if (cursorDirection === 'next') {
        q = query(q, startAfter(cursor));
      } else {
        q = query(q, endBefore(cursor));
      }
    }
    
    // Add limit
    const limitDirection = cursorDirection === 'next' ? limit : limitToLast;
    q = query(q, limitDirection(pageSize + 1)); // Get one extra to check if there's more
    
    return q;
  };

  // Load first page
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const q = buildQuery();
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs;
      const hasExtra = docs.length > pageSize;
      
      if (hasExtra) {
        docs.pop(); // Remove the extra document
      }
      
      const newData = docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to Date objects
        [orderByField]: doc.data()[orderByField]?.toDate?.() || doc.data()[orderByField]
      }));
      
      setData(newData);
      setHasMore(hasExtra);
      setHasPrev(false);
      setLastDoc(docs.length > 0 ? docs[docs.length - 1] : null);
      setFirstDoc(docs.length > 0 ? docs[0] : null);
      
    } catch (err) {
      setError(err);
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  }, [collectionPath, orderByField, orderDirection, pageSize, whereConditions]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    
    try {
      setLoadingMore(true);
      setError(null);
      
      const q = buildQuery(lastDoc, 'next');
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs;
      const hasExtra = docs.length > pageSize;
      
      if (hasExtra) {
        docs.pop(); // Remove the extra document
      }
      
      const newData = docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        [orderByField]: doc.data()[orderByField]?.toDate?.() || doc.data()[orderByField]
      }));
      
      setData(prev => [...prev, ...newData]);
      setHasMore(hasExtra);
      setHasPrev(true);
      setLastDoc(docs.length > 0 ? docs[docs.length - 1] : null);
      
    } catch (err) {
      setError(err);
      console.error('Error loading more data:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc, collectionPath, orderByField, orderDirection, pageSize, whereConditions]);

  // Load previous page
  const loadPrevious = useCallback(async () => {
    if (!hasPrev || loadingPrev || !firstDoc) return;
    
    try {
      setLoadingPrev(true);
      setError(null);
      
      const q = buildQuery(firstDoc, 'prev');
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.reverse(); // Reverse because we're going backwards
      const newData = docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        [orderByField]: doc.data()[orderByField]?.toDate?.() || doc.data()[orderByField]
      }));
      
      setData(prev => [...newData, ...prev]);
      setHasPrev(docs.length === pageSize + 1);
      setHasMore(true);
      setFirstDoc(docs.length > 0 ? docs[0] : null);
      
    } catch (err) {
      setError(err);
      console.error('Error loading previous data:', err);
    } finally {
      setLoadingPrev(false);
    }
  }, [hasPrev, loadingPrev, firstDoc, collectionPath, orderByField, orderDirection, pageSize, whereConditions]);

  // Reset pagination
  const reset = useCallback(() => {
    setData([]);
    setLastDoc(null);
    setFirstDoc(null);
    setHasMore(true);
    setHasPrev(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    loadingMore,
    loadingPrev,
    hasMore,
    hasPrev,
    error,
    loadInitialData,
    loadMore,
    loadPrevious,
    reset
  };
};

/**
 * Simplified hook for one-way pagination (forward only)
 * Perfect for infinite scroll scenarios
 */
export const useInfiniteScroll = (config) => {
  const {
    data,
    loading,
    loadingMore,
    hasMore,
    error,
    loadInitialData,
    loadMore,
    reset
  } = useFirestorePagination(config);

  return {
    data,
    loading,
    loadingMore,
    hasMore,
    error,
    loadInitialData,
    loadMore,
    reset
  };
};
