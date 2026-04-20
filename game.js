const countries = document.querySelectorAll('.country');
const tooltip = document.getElementById('map-tooltip');
const startBtn = document.getElementById('start-btn');

const countryInfo = {
  israel:  { name: 'ישראל',              align: 'שחקן 1', color: '#6aabff' },
  iran:    { name: 'איראן',              align: 'שחקן 2', color: '#ff7a7a' },
  iraq:    { name: 'עיראק',             align: 'ניטרלי',  color: '#7aaa88' },
  syria:   { name: 'סוריה',             align: 'ניטרלי',  color: '#7aaa88' },
  lebanon: { name: 'לבנון',             align: 'ניטרלי',  color: '#7aaa88' },
  jordan:  { name: 'ירדן',              align: 'ניטרלי',  color: '#7aaa88' },
  egypt:   { name: 'מצרים',             align: 'ניטרלי',  color: '#7aaa88' },
  turkey:  { name: 'טורקיה',            align: 'ניטרלי',  color: '#7aaa88' },
  saudi:   { name: 'ערב הסעודית',       align: 'ניטרלי',  color: '#7aaa88' },
  kuwait:  { name: 'כווית',             align: 'ניטרלי',  color: '#7aaa88' },
  uae:     { name: 'איחוד האמירויות',   align: 'ניטרלי',  color: '#7aaa88' },
  yemen:   { name: 'תימן',              align: 'ניטרלי',  color: '#7aaa88' },
  oman:    { name: 'עומאן',             align: 'ניטרלי',  color: '#7aaa88' },
  cyprus:  { name: 'קפריסין',           align: 'ניטרלי',  color: '#7aaa88' },
};

countries.forEach(el => {
  const id = el.id;
  const info = countryInfo[id];
  if (!info) return;

  el.addEventListener('mouseenter', () => {
    tooltip.textContent = `${info.name}  —  ${info.align}`;
    tooltip.setAttribute('fill', info.color);
  });

  el.addEventListener('mouseleave', () => {
    tooltip.textContent = 'רחף מעל מדינה לפרטים';
    tooltip.setAttribute('fill', '#5a8aaa');
  });
});

startBtn.addEventListener('click', () => {
  // placeholder — game screen will be built next
  alert('המשחק יתחיל בקרוב! שלב ראשון: מסך הפתיחה מוכן.');
});
