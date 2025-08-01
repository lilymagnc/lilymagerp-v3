"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Recipient {
  id: string;
  name: string;
  contact: string;
  address: string;
  district: string;
  branchName: string;
  orderCount: number;
  lastOrderDate: Timestamp;
  marketingConsent?: boolean;
}

export function useRecipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecipients = useCallback(async (branchName?: string) => {
    setLoading(true);
    try {
      let recipientsQuery = query(
        collection(db, 'recipients'),
        orderBy('lastOrderDate', 'desc')
      );
      
      if (branchName) {
        recipientsQuery = query(
          collection(db, 'recipients'),
          where('branchName', '==', branchName),
          orderBy('lastOrderDate', 'desc')
        );
      }
      
      const snapshot = await getDocs(recipientsQuery);
      const recipientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipient[];
      
      setRecipients(recipientsData);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 지역별 수령자 통계
  const getRecipientsByDistrict = useCallback(() => {
    const districtStats = recipients.reduce((acc, recipient) => {
      const district = recipient.district;
      if (!acc[district]) {
        acc[district] = {
          count: 0,
          totalOrders: 0,
          recipients: []
        };
      }
      acc[district].count++;
      acc[district].totalOrders += recipient.orderCount;
      acc[district].recipients.push(recipient);
      return acc;
    }, {} as Record<string, { count: number; totalOrders: number; recipients: Recipient[] }>);
    
    return districtStats;
  }, [recipients]);

  // 단골 수령자 (주문 횟수 3회 이상)
  const getFrequentRecipients = useCallback(() => {
    return recipients.filter(recipient => recipient.orderCount >= 3);
  }, [recipients]);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  return {
    recipients,
    loading,
    fetchRecipients,
    getRecipientsByDistrict,
    getFrequentRecipients
  };
}