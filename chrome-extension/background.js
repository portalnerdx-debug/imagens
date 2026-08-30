const CLICK_HOME="https://plataformaclick.com.br";
chrome.runtime.onMessage.addListener((msg, sender) => {
  if(msg?.type!=="RUN_CLICK") return;
  (async()=>{
    const tab=await chrome.tabs.create({url:CLICK_HOME,active:true});
    await chrome.storage.session.set({[`job:${tab.id}`]:msg.payload});
  })();
});
chrome.tabs.onRemoved.addListener(id=>chrome.storage.session.remove(`job:${id}`));