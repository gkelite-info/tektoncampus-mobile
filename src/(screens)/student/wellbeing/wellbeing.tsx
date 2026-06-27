import React from 'react';
import SharedWellbeing from '@/components/SharedWellbeing/wellbeing';

export default function StudentWellbeingPage(props: any) {
  return (
    <SharedWellbeing 
      {...props} 
      route={{ 
        ...props.route, 
        params: { ...props.route?.params, role: 'student' } 
      }} 
    />
  );
}
