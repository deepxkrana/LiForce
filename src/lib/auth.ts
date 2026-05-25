export const logout = () => {
  localStorage.removeItem('liforce_userId');
  localStorage.removeItem('liforce_role');
  window.location.href = '/';
};

export const getDashboardPath = () => {
  const role = localStorage.getItem('liforce_role');
  return role === 'bloodbank' ? '/dashboard/bloodbank' : '/dashboard/donor';
};
