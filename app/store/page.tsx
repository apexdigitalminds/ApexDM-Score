"use client"; 

import React from 'react';
import Layout from '../components/bolt/Layout'; 
import ProtectedRoute from '../components/bolt/ProtectedRoute'; 
import StorePage from '../components/bolt/StorePage'; 

export default function Page() {
  return (
    <Layout>
      <ProtectedRoute>
        <StorePage /> 
      </ProtectedRoute>
    </Layout>
  );
}