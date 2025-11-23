"use client"; 

import React from 'react';
import Layout from '../components/bolt/Layout'; 
import AdminRoute from '../components/bolt/AdminRoute'; // Assuming you want this protected
import AnalyticsPage from '../components/bolt/AnalyticsPage'; 

export default function Page() {
  return (
    <Layout>
      <AdminRoute>
        <AnalyticsPage /> 
      </AdminRoute>
    </Layout>
  );
}