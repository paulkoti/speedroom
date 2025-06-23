export const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8) + '-' + 
         Math.random().toString(36).substring(2, 8);
};

export const getRoomIdFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('sala');
};

export const setRoomIdInUrl = (roomId) => {
  const url = new URL(window.location);
  url.searchParams.set('sala', roomId);
  window.history.replaceState({}, '', url);
};

export const generateUserId = () => {
  return 'user-' + Math.random().toString(36).substring(2, 15);
};

export const copyRoomUrl = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch (error) {
    console.error('Erro ao copiar URL:', error);
    return false;
  }
};