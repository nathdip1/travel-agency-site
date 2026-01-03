(async function () {
  try {
    // 1. Load config
    const configRes = await fetch('./config.json');
    const config = await configRes.json();

    // Base API URL (for POST)
    const API_BASE_URL = config.TRIPS_API_URL.split('?')[0];

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

        <button class="inquiry-btn">Inquiry Now</button>
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

        // Close other forms
        document.querySelectorAll('.inquiry-form').forEach(f => f.remove());

        // Final price logic
        const finalPrice =
          Number(trip.Offer_Price) > 0 ? trip.Offer_Price : trip.Base_Price;

        // Create inquiry form
        const formDiv = document.createElement('div');
        formDiv.className = 'inquiry-form';

        formDiv.innerHTML = `
          <p><strong>Trip:</strong> ${trip.Destination}</p>
          <p><strong>Price:</strong> ₹${finalPrice}</p>

          <input type="text" placeholder="Your Name" />
          <input type="tel" placeholder="Mobile Number" />
          <input type="text" placeholder="Area / District" />

          <button class="submit-inquiry-btn">Submit Inquiry</button>
          <p class="form-status"></p>
        `;

        card.appendChild(formDiv);

        // ===== SUBMIT LOGIC (THIS WAS MISSING PLACE) =====
        const submitBtn = formDiv.querySelector('.submit-inquiry-btn');
        const statusEl = formDiv.querySelector('.form-status');
        const inputs = formDiv.querySelectorAll('input');

        submitBtn.addEventListener('click', async () => {
          const payload = {
            trip: trip.Destination,
            price: finalPrice,
            name: inputs[0].value.trim(),
            mobile: inputs[1].value.trim(),
            area: inputs[2].value.trim()
          };

          if (!payload.name || !payload.mobile || !payload.area) {
            statusEl.textContent = 'Please fill all details.';
            statusEl.style.color = 'red';
            return;
          }

          try {
            const formData = new URLSearchParams(payload);

            await fetch(API_BASE_URL, {
            method: 'POST',
              mode: 'no-cors',
              body: formData
            }); 

            statusEl.textContent = 'Inquiry submitted successfully!';
            statusEl.style.color = 'green';

            inputs.forEach(i => (i.value = ''));
          } catch (err) {
            console.error(err);
            statusEl.textContent = 'Failed to submit. Please try again.';
            statusEl.style.color = 'red';
          }
        });
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
