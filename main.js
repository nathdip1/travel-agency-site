const TRIPS_PER_PAGE = 4;
let currentPage = 1;

(async function () {
  try {
    // Load config
    const configRes = await fetch('./config.json');
    const config = await configRes.json();

    const API_BASE_URL =
      config.INQUIRY_FORM_URL || config.TRIPS_API_URL.split('?')[0];

    // Fetch trips
    const tripsRes = await fetch(config.TRIPS_API_URL);
    const trips = await tripsRes.json();

    const tripsContainer = document.getElementById('trips-container');
    const paginationEl = document.getElementById('pagination');
    const noTripsSection = document.getElementById('no-trips-section');
    const noTripsMessage = document.getElementById('no-trips-message');

    // Filter + sort trips
    const activeTrips = trips
      .filter(t => t.Status === 'ACTIVE')
      .sort((a, b) => new Date(a.Start_Date) - new Date(b.Start_Date));

    if (activeTrips.length === 0) {
      document.getElementById('trips-section').style.display = 'none';
      noTripsMessage.textContent =
        'No trips planned right now. Please check back soon.';
      noTripsSection.style.display = 'block';
      return;
    }

    const totalPages = Math.ceil(activeTrips.length / TRIPS_PER_PAGE);

    renderTripsPage(currentPage);

    function renderTripsPage(page) {
      tripsContainer.innerHTML = '';

      const start = (page - 1) * TRIPS_PER_PAGE;
      const end = start + TRIPS_PER_PAGE;
      const tripsToShow = activeTrips.slice(start, end);

      tripsToShow.forEach(trip => {
        const card = document.createElement('div');
        card.className = 'trip-card';

        const basePrice = Number(trip.Base_Price);
        const offerPrice = Number(trip.Offer_Price);

        let priceHtml = '';
        if (offerPrice > 0 && offerPrice < basePrice) {
          const discountPercent = Math.ceil(
            ((basePrice - offerPrice) / basePrice) * 100
          );
          priceHtml = `
            <p class="base-price strike">Price: ₹${basePrice}/person</p>
            <p class="offer-price">
              Offer Price: ₹${offerPrice}/person
              <span class="discount-badge">(${discountPercent}% OFF)</span>
            </p>
          `;
        } else {
          priceHtml = `<p class="base-price">Price: ₹${basePrice}/person</p>`;
        }

        const badge = getTripBadge(trip);

        card.innerHTML = `
          <div class="trip-badge ${badge.type}">${badge.text}</div>
          <h3>${trip.Destination}</h3>
          <p><strong>Dates:</strong> ${formatDate(trip.Start_Date)} – ${formatDate(trip.End_Date)}</p>
          <p><strong>Slots:</strong> ${trip.Remaining_Slots} / ${trip.Total_Slots}</p>
          ${priceHtml}
          <p>${trip.Notes || ''}</p>
          <button class="inquiry-btn">Inquiry Now</button>
        `;

        tripsContainer.appendChild(card);

        // Inquiry logic (unchanged)
        const inquiryBtn = card.querySelector('.inquiry-btn');
        inquiryBtn.addEventListener('click', () => {
          const existing = card.querySelector('.inquiry-form');
          if (existing) {
            existing.remove();
            return;
          }

          document.querySelectorAll('.inquiry-form').forEach(f => f.remove());

          const finalPrice =
            offerPrice > 0 && offerPrice < basePrice
              ? offerPrice
              : basePrice;

          const formDiv = document.createElement('div');
          formDiv.className = 'inquiry-form';

          formDiv.innerHTML = `
            <p><strong>Trip:</strong> ${trip.Destination}</p>
            <p><strong>Price:</strong> ₹${finalPrice}</p>

            <input type="text" placeholder="Your Name" />
            <input type="tel" placeholder="Mobile Number" inputmode="numeric" maxlength="10" />
            <input type="text" placeholder="Area / District" />

            <button class="submit-inquiry-btn">Submit Inquiry</button>
            <p class="form-status"></p>
          `;

          card.appendChild(formDiv);

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

            if (!/^[0-9]{10}$/.test(payload.mobile)) {
              statusEl.textContent =
                'Please enter a valid 10-digit mobile number.';
              statusEl.style.color = 'red';
              return;
            }

            await fetch(API_BASE_URL, {
              method: 'POST',
              mode: 'no-cors',
              body: new URLSearchParams(payload)
            });

            statusEl.textContent = 'Inquiry submitted successfully!';
            statusEl.style.color = 'green';
            inputs.forEach(i => (i.value = ''));
          });
        });
      });

      renderPagination();
    }

    function renderPagination() {
      paginationEl.innerHTML = '';
      if (totalPages <= 1) return;

      const prevBtn = document.createElement('button');
      prevBtn.textContent = '← Previous';
      prevBtn.disabled = currentPage === 1;
      prevBtn.onclick = () => {
        currentPage--;
        renderTripsPage(currentPage);
        document
          .getElementById('trips-section')
          .scrollIntoView({ behavior: 'smooth' });
      };

      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Next →';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.onclick = () => {
        currentPage++;
        renderTripsPage(currentPage);
        document
          .getElementById('trips-section')
          .scrollIntoView({ behavior: 'smooth' });
      };

      paginationEl.appendChild(prevBtn);
      paginationEl.appendChild(nextBtn);
    }
  } catch (err) {
    console.error(err);
  }
})();

function getTripBadge(trip) {
  const today = new Date();
  const start = new Date(trip.Start_Date);
  const end = new Date(trip.End_Date);

  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today > end) return { text: 'TRIP COMPLETED', type: 'completed' };

  const diffDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 70) return { text: 'BOOKING CLOSED', type: 'closed' };
  if (Number(trip.Remaining_Slots) <= 0)
    return { text: 'SOLD OUT', type: 'soldout' };

  return { text: 'BOOKING AVAILABLE', type: 'available' };
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString();
}
