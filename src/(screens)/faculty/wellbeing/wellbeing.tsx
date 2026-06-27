import React from 'react';
import SharedWellbeing from '@/components/SharedWellbeing/wellbeing';

export default function FacultyWellbeingPage(props: any) {
  return (
    <SharedWellbeing 
      {...props} 
      route={{ 
        ...props.route, 
        params: { ...props.route?.params, role: 'faculty' } 
      }} 
    />
  );
}
