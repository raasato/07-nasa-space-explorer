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

// List of facts we can show above the gallery
const spaceFacts = [
  'A day on Venus is longer than a year on Venus.',
  'Neutron stars can spin faster than 600 times every second.',
  'One million Earths could fit inside the Sun.',
  'Saturn could float in water because it is less dense than water.',
  'The footprints from Apollo astronauts can last on the Moon for millions of years.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.'
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

    // Fetch the data from NASA's API
    const response = await fetch(apiUrl);

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
    gallery.innerHTML = `<p>Error loading images: ${error.message}</p>`;
  }
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
