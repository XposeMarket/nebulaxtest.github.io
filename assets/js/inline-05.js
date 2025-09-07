
/** ===== NebulaX Click-to-Coin Utilities ===== */
window.NX = window.NX || {};
NX.saveSelectedCoin = function(coin){
  try { localStorage.setItem('nebula_selected_coin', JSON.stringify(coin)); } catch(e){}
};
NX.goToCoin = function(coin){
  NX.saveSelectedCoin(coin);
  const pair = coin.pair || (coin.symbol ? (coin.symbol.toUpperCase()+'/SOL') : '');
  const mint = encodeURIComponent(coin.mint || '');
  const qp = `?pair=${encodeURIComponent(pair)}${mint ? `&mint=${mint}` : ''}`;
  location.href = `Coinpage-Official.html${pair ? qp : ''}`;
};
