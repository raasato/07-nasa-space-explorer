// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const button = document.querySelector('button');
const gallery = document.getElementById('gallery');
const randomFactText = document.getElementById('randomFact');

// Find modal elements
const imageModal = document.getElementById('imageModal');
const modalClose = document.querySelector('.modal-close');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// NASA API Key - Replace 'DEMO_KEY' with your own key from https://api.nasa.gov/
const NASA_API_KEY = 'ajiLMxQ1mcozLbsstlouasLLWGsiXG9YlbC5jXCa';
const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRIES = 1;

// List of facts we can show above the gallery
const spaceFacts = [
  'Saturn is the only planet in our solar system that is less dense than water.',
  'Mercury is the fastest planet in our solar system. A year on Mercury is equal to 88 Earth days.',
  'Neptune’s winds are the fastest in the solar system, reaching 2,575 kilometers per hour (1,600 miles per hour)!',
  'More than 1,300 Earths would fit into Jupiter’s vast sphere.',
  'A Venus day is approximately 243 Earth days long.',
  'Jupiter’s moon Io is the most volcanically active body in our solar system.',
  'The largest canyon system in the solar system is Valles Marineris on Mars. It’s more than 4,000 kilometers (3,000 miles) long — enough to stretch from California to New York. It is nine times as long and four times as deep as Earth’s Grand Canyon!',
  'The average temperature on Venus is more than 480 degrees Celsius (about 900 degrees Fahrenheit).',
  'Our solar system includes the Sun, eight planets, five officially named dwarf planets, hundreds of moons, and thousands of asteroids and comets.',
  'Our solar system is located in the Milky Way, a barred spiral galaxy with two major arms, and two minor arms. Our Sun is in a small, partial arm of the Milky Way called the Orion Arm, or Orion Spur, between the Sagittarius and Perseus arms.',
  'Our solar system orbits the center of the galaxy at about 515,000 mph (828,000 kph). It takes about 230 million years to complete one orbit around the galactic center.',
  'Of the eight planets, Mercury and Venus are the only ones with no moons, although Venus does have a quasi-satellite that has officially been named Zoozve.',
  'Pluto, smaller than our own moon, has five moons in its orbit, including Charon, a moon so large it makes Pluto wobble.',
  'Our solar system formed about 4.6 billion years ago from a dense cloud of interstellar gas and dust. The cloud collapsed, possibly due to the shockwave of a nearby exploding star, called a supernova. When this dust cloud collapsed, it formed a solar nebula – a spinning, swirling disk of material.',
  'At the center, gravity pulled more and more material in. Eventually, the pressure in the core was so great that hydrogen atoms began to combine and form helium, releasing a tremendous amount of energy. With that, our Sun was born.',
  'Nearest to the Sun, only rocky material could withstand the heat when the solar system was young. For this reason, the first four planets – Mercury, Venus, Earth, and Mars – are terrestrial planets.',
  'Materials we are used to seeing as ice, liquid, or gas settled in the outer regions of the young solar system. Gravity pulled these materials together, and that is where we find gas giants Jupiter and Saturn, and the ice giants Uranus and Neptune.'
];


// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Pick one fact at random each time the page loads
function showRandomFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  const selectedFact = spaceFacts[randomIndex];

  // Make sure the fact element exists before updating text
  if (randomFactText) {
    randomFactText.textContent = selectedFact;
  }
}

showRandomFact();

// Function to open the modal and display image details
function openModal(image) {
  // Get the media container
  const mediaContainer = document.getElementById('modalMediaContainer');
  
  // Set the modal text content
  modalTitle.textContent = image.title;
  modalDate.textContent = image.date;
  modalExplanation.textContent = image.explanation;
  
  // Check if the media is a video or image
  if (image.media_type === 'video') {
    // For videos, check if it's a direct video file or YouTube link
    let videoUrl = image.url;
    
    // Check if it's a YouTube link
    if (videoUrl.includes('youtube.com/watch')) {
      // Extract the video ID from the URL
      const videoId = videoUrl.split('v=')[1];
      videoUrl = `https://www.youtube.com/embed/${videoId}`;
      
      // Display as an embedded iframe
      mediaContainer.innerHTML = `
        <div class="modal-video">
          <iframe src="${videoUrl}" allowfullscreen></iframe>
        </div>
      `;
    } else {
      // It's a direct video file - use HTML5 video player
      mediaContainer.innerHTML = `
        <div class="modal-video">
          <video controls>
            <source src="${videoUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      `;
    }
  } else {
    // For images, display the image
    mediaContainer.innerHTML = `
      <img id="modalImage" src="${image.url}" alt="${image.title}" />
    `;
  }
  
  // Show the modal by adding the active class
  imageModal.classList.add('active');
}

// Function to close the modal
function closeModal() {
  // Hide the modal by removing the active class
  imageModal.classList.remove('active');
}

// Add event listener to the close button
modalClose.addEventListener('click', closeModal);

// Close modal when clicking outside the modal content
imageModal.addEventListener('click', (event) => {
  // Only close if clicking on the modal background (not the content)
  if (event.target === imageModal) {
    closeModal();
  }
});

// Close modal on Escape key press
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

// Function to fetch images from NASA's APOD API
async function fetchNASAImages() {
  // Disable the button while loading to avoid duplicate requests
  button.disabled = true;

  try {
    // Get the selected dates from the input fields
    const startDate = startInput.value;
    const endDate = endInput.value;

    // Build the NASA API URL with our parameters
    // API documentation: https://github.com/nasa/apod-api
    const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;

    // Log the URL for debugging
    console.log('API URL:', apiUrl);

    // Show loading message with spinner
    gallery.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>Searching the cosmos for your images...</p>
      </div>
    `;

    // Fetch the data with timeout and a small retry for temporary network issues
    const response = await fetchWithRetry(apiUrl, MAX_RETRIES);

    // Check if the request was successful
    if (!response.ok) {
      // Get the error message from the response
      const errorData = await response.text();
      console.error('API Response:', errorData);
      throw new Error(`API Error ${response.status}: ${errorData}`);
    }

    // Convert the response to JSON format
    const images = await response.json();

    // Display the images in the gallery
    displayImages(images);
  } catch (error) {
    // If something goes wrong, show an error message
    console.error('Error fetching NASA images:', error);
    gallery.innerHTML = `<p>${getFriendlyErrorMessage(error)}</p>`;
  } finally {
    // Always re-enable the button after loading or error
    button.disabled = false;
  }
}

// Fetch helper that applies a timeout and retries for temporary failures
async function fetchWithRetry(url, retriesLeft) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    // Retry once for temporary server errors
    if ((response.status === 503 || response.status === 504) && retriesLeft > 0) {
      return fetchWithRetry(url, retriesLeft - 1);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry once for temporary network interruptions
    if (retriesLeft > 0) {
      return fetchWithRetry(url, retriesLeft - 1);
    }

    throw error;
  }
}

// Convert technical API errors into student-friendly messages
function getFriendlyErrorMessage(error) {
  const rawMessage = String(error.message || 'Unknown error');

  if (rawMessage.includes('API Error 503') || rawMessage.includes('API Error 504')) {
    return 'NASA API is temporarily unavailable (503). Please try again in a moment.';
  }

  if (error.name === 'AbortError') {
    return 'Request timed out. Please check your internet connection and try again.';
  }

  if (rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError')) {
    return 'Could not connect to NASA API. Please check your internet connection and try again.';
  }

  return `Error loading images: ${rawMessage}`;
}

// Function to display images in the gallery
function displayImages(images) {
  // Clear the gallery first
  gallery.innerHTML = '';

  // Loop through each item returned from the API
  images.forEach((item) => {
    // Create a container div for each item (image or video)
    const itemCard = document.createElement('div');
    itemCard.className = 'gallery-item';

    // Check if this is an image or video
    if (item.media_type === 'image') {
      // Display as an image
      itemCard.innerHTML = `
        <img src="${item.url}" alt="${item.title}" style="cursor: pointer;" />
      `;
    } else if (item.media_type === 'video') {
      // Create a placeholder thumbnail for the video
      itemCard.innerHTML = `
        <div style="position: relative; width: 100%; height: 250px; background: #000; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="font-size: 60px; color: #E74836;">▶</div>
          <div class="video-badge">VIDEO</div>
        </div>
      `;
    }
    
    // Add a click event listener to open the modal when the item is clicked
    itemCard.addEventListener('click', () => {
      openModal(item);
    });
    
    // Add the card to the gallery
    gallery.appendChild(itemCard);
  });

  // Show message if no items were found
  if (gallery.children.length === 0) {
    gallery.innerHTML = '<p>No images or videos found for the selected date range.</p>';
  }
}

// Add a click event listener to the "Get Space Images" button
button.addEventListener('click', fetchNASAImages);
