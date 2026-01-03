(async function () {
  try {
    // 1. Load config
    const configRes = await fetch('./config.json');
    const config = await configRes.json();

    // 2. Fetch trips
    const tripsRes = await fetch(config.TRIPS_API_URL);
    const trips = await tripsRes.json();

    const tripsContainer = document.getElementById('trips-container');
    const noTripsSection = document.getElementById('no-trips-section');
    const noTripsMessage = document.getElementById('no-trips-message');

    // 3. Filter ACTIVE trips
    const activeTrips = trips.filter(t => t.Status === 'ACTIVE');

    // 4. No trips case
    if (activeTrips.length === 0) {
      document.getElementById('trips-section').style.display = 'none';
      noTripsMessage.textContent = 'No trips planned right now. Please check back soon.';
      noTripsSection.style.display = 'block';
      return;
    }

    // 5. Render trips
    tripsContainer.innerHTML = '';

    activeTrips.forEach(trip => {
      const card = document.createElement('div');
      card.className = 'trip-card';

      const offerHtml =
        Number(trip.Offer_Price) > 0
          ? `<p class="offer-price">Offer Price: ₹${trip.Offer_Price}</p>`
          : '';

      card.innerHTML = `
        <h3>${trip.Destination}</h3>
        <p><strong>Dates:</strong> ${formatDate(trip.Start_Date)} – ${formatDate(trip.End_Date)}</p>
        <p><strong>Slots:</strong> ${trip.Remaining_Slots} / ${trip.Total_Slots}</p>
        <p class="base-price">Price: ₹${trip.Base_Price}</p>
        ${offerHtml}
        <p>${trip.Notes || ''}</p>

        <button class="inquiry-btn">
          Inquiry Now
        </button>
      `;

      tripsContainer.appendChild(card);

      // ===== INQUIRY BUTTON LOGIC =====
      const inquiryBtn = card.querySelector('.inquiry-btn');

      inquiryBtn.addEventListener('click', () => {
        // Toggle existing form
        const existingForm = card.querySelector('.inquiry-form');
        if (existingForm) {
          existingForm.remove();
          return;
        }

        // Remove other open forms (optional but recommended)
        document.querySelectorAll('.inquiry-form').forEach(f => f.remove());

        // Determine price to show
        const finalPrice =
          Number(trip.Offer_Price) > 0 ? trip.Offer_Price : trip.Base_Price;

        // Create inquiry form
        const formDiv = document.createElement('div');
        formDiv.className = 'inquiry-form';

        formDiv.innerHTML = `
          <p><strong>Trip:</strong> ${trip.Destination}</p>
          <p><strong>Price:</strong> ₹${finalPrice}</p>

          <input type="text" placeholder="Your Name" required />
          <input type="tel" placeholder="Mobile Number" required />
          <input type="text" placeholder="Area / District" required />

          <button class="submit-inquiry-btn">Submit Inquiry</button>
        `;

        card.appendChild(formDiv);
      });
    });

  } catch (err) {
    console.error(err);
    document.getElementById('trips-container').innerHTML =
      '<p>Error loading trips.</p>';
  }
})();

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}
