"use client"; 

import React from 'react';
import Layout from '../components/bolt/Layout'; 
import AdminRoute from '../components/bolt/AdminRoute';
import AdminPage from '../components/bolt/AdminPage'; 

export default function Page() {
  return (
    <Layout>
      <AdminRoute>
        <AdminPage /> 
      </AdminRoute>
    </Layout>
  );
}