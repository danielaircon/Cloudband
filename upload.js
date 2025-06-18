// CloudBand Upload Script
// Add this to your main.js file or include it in your HTML

// Use the shared Supabase client from main.js
let supabase;

// Global variables to store selected files
let selectedAudioFile = null;
let selectedCoverFile = null;

// DOM elements
const fileInput = document.getElementById('fileInput');
const coverImageInput = document.getElementById('coverImageInput');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('Author');
const uploadButton = document.querySelector('button[class*="bg-purple-500"]');
const dropzone = document.querySelector('.border-dashed');

// Initialize the upload functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeUpload();
});

function initializeUpload() {
    // Get the shared Supabase client from main.js
    supabase = window.supabaseClient;
    
    if (!supabase) {
        console.error('Supabase client not available. Make sure main.js is loaded first.');
        return;
    }
    
    // File input handlers
    fileInput.addEventListener('change', handleAudioFileSelect);
    coverImageInput.addEventListener('change', handleCoverImageSelect);
    
    // Drag and drop handlers for audio files
    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);
    
    // Upload button handler
    uploadButton.addEventListener('click', handleUpload);
    
    // Check authentication status
    checkAuthStatus();
}

// Authentication check
async function checkAuthStatus() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            // Redirect to login if not authenticated
            alert('Please log in to upload tracks');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('User authenticated:', user.email);
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
    }
}

// Handle audio file selection
function handleAudioFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndSetAudioFile(file);
    }
}

// Handle cover image selection
function handleCoverImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndSetCoverFile(file);
    }
}

// Validate and set audio file
function validateAndSetAudioFile(file) {
    // Check if it's an audio file
    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/aac'];
    
    if (!allowedAudioTypes.includes(file.type)) {
        alert('Please select a valid audio file (MP3, WAV, M4A, AAC)');
        return;
    }
    
    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
        alert('Audio file size must be less than 50MB');
        return;
    }
    
    selectedAudioFile = file;
    updateDropzoneDisplay(`Selected: ${file.name}`);
    console.log('Audio file selected:', file.name);
}

// Validate and set cover image file
function validateAndSetCoverFile(file) {
    // Check if it's an image file
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedImageTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, JPG, PNG, WEBP)');
        return;
    }
    
    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        alert('Image file size must be less than 5MB');
        return;
    }
    
    selectedCoverFile = file;
    updateCoverImageDisplay(`Selected: ${file.name}`);
    console.log('Cover image selected:', file.name);
}

// Update dropzone display
function updateDropzoneDisplay(message) {
    const dropzoneText = dropzone.querySelector('p.font-semibold');
    if (dropzoneText) {
        dropzoneText.textContent = message;
        dropzoneText.classList.add('text-green-400');
    }
}

// Update cover image display
function updateCoverImageDisplay(message) {
    const coverText = document.querySelector('[for="coverImageInput"]').nextElementSibling.querySelector('p');
    if (coverText) {
        coverText.textContent = message;
        coverText.classList.add('text-green-400');
    }
}

// Drag and drop handlers
function handleDragOver(event) {
    event.preventDefault();
    dropzone.classList.add('border-purple-500', 'bg-purple-500/10');
}

function handleDragLeave(event) {
    event.preventDefault();
    dropzone.classList.remove('border-purple-500', 'bg-purple-500/10');
}

function handleDrop(event) {
    event.preventDefault();
    dropzone.classList.remove('border-purple-500', 'bg-purple-500/10');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        validateAndSetAudioFile(files[0]);
    }
}

// Generate unique filename
function generateUniqueFilename(originalName, userId) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${userId}_${timestamp}_${randomString}.${extension}`;
}

// Upload file to Supabase Storage
async function uploadFileToStorage(file, bucket, filename) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error(`Error uploading to ${bucket}:`, error);
        throw error;
    }
}

// Save track metadata to database
async function saveTrackToDatabase(trackData) {
    try {
        const { data, error } = await supabase
            .from('tracks')
            .insert([trackData])
            .select();
        
        if (error) {
            throw error;
        }
        
        return data[0];
    } catch (error) {
        console.error('Error saving track to database:', error);
        throw error;
    }
}

// Show loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        uploadButton.disabled = true;
        uploadButton.innerHTML = `
            <div class="flex items-center justify-center gap-2">
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Uploading...
            </div>
        `;
    } else {
        uploadButton.disabled = false;
        uploadButton.innerHTML = 'Upload Track';
    }
}

// Main upload handler
async function handleUpload(event) {
    event.preventDefault();
    
    // Validate form
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    
    if (!title) {
        alert('Please enter a track title');
        titleInput.focus();
        return;
    }
    
    if (!author) {
        alert('Please enter the author name');
        authorInput.focus();
        return;
    }
    
    if (!selectedAudioFile) {
        alert('Please select an audio file');
        return;
    }
    
    if (!selectedCoverFile) {
        alert('Please select a cover image');
        return;
    }
    
    try {
        setLoadingState(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            throw new Error('User not authenticated');
        }
        
        // Generate unique filenames
        const audioFilename = generateUniqueFilename(selectedAudioFile.name, user.id);
        const coverFilename = generateUniqueFilename(selectedCoverFile.name, user.id);
        
        // Upload audio file
        console.log('Uploading audio file...');
        const audioUploadResult = await uploadFileToStorage(selectedAudioFile, 'songs', audioFilename);
        
        // Upload cover image
        console.log('Uploading cover image...');
        const coverUploadResult = await uploadFileToStorage(selectedCoverFile, 'song-image', coverFilename);
        
        // Get public URLs for database storage (consistent with main.js approach)
        const songUrl = supabase.storage.from('songs').getPublicUrl(audioUploadResult.path).data.publicUrl;
        const coverUrl = supabase.storage.from('song-image').getPublicUrl(coverUploadResult.path).data.publicUrl;
        
        // Save track metadata to database
        console.log('Saving track to database...');
        const trackData = {
            user_id: user.id,
            title: title,
            author: author,
            song_path: songUrl,        // Store public URL instead of path
            cover_path: coverUrl       // Store public URL instead of path
        };
        
        const savedTrack = await saveTrackToDatabase(trackData);
        
        // Success!
        alert('Track uploaded successfully!');
        console.log('Track uploaded:', savedTrack);
        
        // Reset form
        resetForm();
        
        // Optionally redirect to library or track page
        // window.location.href = 'library.html';
        
    } catch (error) {
        console.error('Upload error:', error);
        alert(`Upload failed: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
}

// Reset form after successful upload
function resetForm() {
    titleInput.value = '';
    authorInput.value = '';
    fileInput.value = '';
    coverImageInput.value = '';
    selectedAudioFile = null;
    selectedCoverFile = null;
    
    // Reset dropzone display
    const dropzoneText = dropzone.querySelector('p.font-semibold');
    if (dropzoneText) {
        dropzoneText.textContent = 'Drag and drop your file here';
        dropzoneText.classList.remove('text-green-400');
    }
    
    // Reset cover image display
    const coverText = document.querySelector('[for="coverImageInput"]').nextElementSibling.querySelector('p');
    if (coverText) {
        coverText.textContent = 'Upload album art or song cover';
        coverText.classList.remove('text-green-400');
    }
}

// Utility function to get file URL from Supabase Storage
async function getFileUrl(bucket, path) {
    try {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
        
        return data.publicUrl;
    } catch (error) {
        console.error('Error getting file URL:', error);
        return null;
    }
}

// Export functions for use in other files if needed
window.CloudBandUpload = {
    uploadFileToStorage,
    saveTrackToDatabase,
    getFileUrl,
    generateUniqueFilename
};
