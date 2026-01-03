(async function () {
  try {
    const response = await fetch('./config.json');
    if (!response.ok) throw new Error('Unable to load config.json');

    const config = await response.json();
    console.log('Config loaded:', config);

    const p = document.createElement('p');
    p.textContent = 'Config loaded successfully.';
    document.body.appendChild(p);
  } catch (err) {
    console.error(err);
    const p = document.createElement('p');
    p.textContent = 'Error loading configuration.';
    document.body.appendChild(p);
  }
})();
