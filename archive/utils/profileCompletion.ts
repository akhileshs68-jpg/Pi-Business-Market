export const getProfileCompletion = (user: any) => {
  const completionFields = [
    'photoUrl', 'displayName', 'fullName', 'mobileNumber', 
    'email', 'country', 'state', 'city', 'addressLine1', 'postalCode'
  ];
  
  if (!user) return { percentage: 0, missingFields: completionFields };
  
  const mobileValue = user.mobileNumber || user.phone;
  const filledFields = completionFields.filter(key => {
    if (key === 'mobileNumber') return !!mobileValue;
    return !!user[key];
  });
  
  const missingFields = completionFields.filter(key => {
    if (key === 'mobileNumber') return !mobileValue;
    return !user[key];
  });

  const percentage = Math.round((filledFields.length / completionFields.length) * 100);
  return { percentage, missingFields };
};
