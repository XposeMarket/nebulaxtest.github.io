/**
 * Profile Avatar Sync Utility
 * Syncs profile avatar across all NebulaX platform pages
 * Include this script on pages that have a profile pic header element
 */

(function(){
  const AVATAR_KEY = 'nx_platform_avatar';
  const EVENT_NAME = 'nebula:avatar:changed';
  
  // Initialize: load any existing avatar from localStorage
  function initAvatarSync(){
    try{
      const savedAvatar = localStorage.getItem(AVATAR_KEY);
      if(savedAvatar){
        updateHeaderAvatar(savedAvatar);
      }
    } catch{}
  }
  
  // Update the header profile pic element
  function updateHeaderAvatar(avatarSrc){
    // Try common header profile pic selectors
    const selectors = ['#nx-pfp', '[data-avatar-header]', '.header-avatar img'];
    for(const sel of selectors){
      const el = document.querySelector(sel);
      if(el && el.tagName === 'IMG'){
        el.src = avatarSrc;
        return;
      }
    }
  }
  
  // Save avatar to shared storage
  window.setProfileAvatar = function(avatarSrc){
    try{
      localStorage.setItem(AVATAR_KEY, avatarSrc);
      updateHeaderAvatar(avatarSrc);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, {detail:{avatar:avatarSrc}}));
    } catch(e){
      console.error('Failed to save profile avatar:', e);
    }
  };
  
  // Get current avatar
  window.getProfileAvatar = function(){
    try{
      return localStorage.getItem(AVATAR_KEY);
    } catch{
      return null;
    }
  };
  
  // Listen for avatar changes from other pages/tabs
  window.addEventListener('storage', (e)=>{
    if(e.key === AVATAR_KEY && e.newValue){
      updateHeaderAvatar(e.newValue);
    }
  });
  
  // Listen for avatar change events from same page
  window.addEventListener(EVENT_NAME, (e)=>{
    if(e.detail?.avatar){
      updateHeaderAvatar(e.detail.avatar);
    }
  });
  
  // Initialize on document ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initAvatarSync);
  } else {
    initAvatarSync();
  }
})();
