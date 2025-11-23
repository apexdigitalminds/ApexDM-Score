"use client"; 

import React from 'react';
import Layout from '../components/bolt/Layout'; 
import ProtectedRoute from '../components/bolt/ProtectedRoute'; 
import BadgeShowcase from '../components/bolt/BadgeShowcase'; 

export default function Page() {
  return (
    <Layout>
      <ProtectedRoute>
        <BadgeShowcase /> 
      </ProtectedRoute>
    </Layout>
  );
}