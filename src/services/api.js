export const fetchPhotos = async () => {
  try {
    const res = await fetch('/api/photos');
    return await res.json();
  } catch (e) {
    console.log("fetchPhotos Error:", e);
    return [];
  }
};

export const fetchAccounts = async () => {
  try {
    const res = await fetch('/api/accounts');
    return await res.json();
  } catch (e) {
    console.log("fetchAccounts Error:", e);
    return [];
  }
};

export const fetchStats = async () => {
  try {
    const res = await fetch('/api/stats');
    return await res.json();
  } catch (e) {
    console.log("fetchStats Error:", e);
    return null;
  }
};

export const addAccount = async (accountData) => {
  try {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountData)
    });
    return await res.json();
  } catch (e) {
    console.log("addAccount Error:", e);
    return null;
  }
};

export const deleteMedia = async (item) => {
  try {
    const res = await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, source: item.source })
    });
    return await res.json();
  } catch (e) {
    console.log("deleteMedia Error:", e);
    return null;
  }
};

export const uploadMedia = async (formData) => {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    return await res.json();
  } catch (e) {
    console.log("uploadMedia Error:", e);
    return null;
  }
};

export const renameFolder = async (folderType, oldName, newName, folderIdOrPath = '') => {
  try {
    const res = await fetch('/api/rename-folder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderType, oldName, newName, folderIdOrPath })
    });
    return await res.json();
  } catch (e) {
    console.log("renameFolder Error:", e);
    return null;
  }
};

window.fetchPhotos = fetchPhotos;
window.fetchAccounts = fetchAccounts;
window.fetchStats = fetchStats;
window.addAccount = addAccount;
window.deleteMedia = deleteMedia;
window.uploadMedia = uploadMedia;
window.renameFolder = renameFolder;
