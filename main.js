// Supabase config
const SUPABASE_URL = 'https://pibzqbgubzrhtcqfftov.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpYnpxYmd1YnpyaHRjcWZmdG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNDMzNjYsImV4cCI6MjA0OTcxOTM2Nn0.example_key'; // Replace with real anon key

let supabaseClient;
let authLoading, notAuthenticated, authenticated, logoutBtn, libraryLink, userEmail;

function initDOM() {
  authLoading = document.getElementById('auth-loading');
  notAuthenticated = document.getElementById('not-authenticated');
  authenticated = document.getElementById('authenticated');
  logoutBtn = document.getElementById('logout-btn');
  libraryLink = document.getElementById('library-link');
  userEmail = document.getElementById('user-email');
}

function showAuthenticated(user) {
  if (authLoading) authLoading.classList.add('hidden');
  if (notAuthenticated) notAuthenticated.classList.add('hidden');
  if (authenticated) authenticated.classList.remove('hidden');
  if (libraryLink) libraryLink.classList.remove('hidden');
  if (userEmail) userEmail.textContent = user.email;
  lucide.createIcons();
}

function showNotAuthenticated() {
  if (authLoading) authLoading.classList.add('hidden');
  if (authenticated) authenticated.classList.add('hidden');
  if (notAuthenticated) notAuthenticated.classList.remove('hidden');
  if (libraryLink) libraryLink.classList.add('hidden');
  lucide.createIcons();
}

async function checkAuthStatus() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  console.log('Session:', session, 'Error:', error);

  if (session && session.user) {
    showAuthenticated(session.user);
  } else {
    showNotAuthenticated();
  }
}

async function logout() {
  if (logoutBtn) {
    logoutBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Logging out...';
    logoutBtn.disabled = true;
  }

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error('Logout error:', error);
    alert('Error logging out. Please try again.');
  } else {
    window.location.href = 'index.html'; // Ensure redirect after logout
  }

  if (logoutBtn) {
    logoutBtn.innerHTML = '<i data-lucide="log-out" class="w-4 h-4"></i> Logout';
    logoutBtn.disabled = false;
    lucide.createIcons();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  initDOM();
  lucide.createIcons();
  checkAuthStatus();

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Optional: Watch for auth state changes across tabs/pages
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);

    if (event === 'SIGNED_IN' && session?.user) {
      showAuthenticated(session.user);
    } else if (event === 'SIGNED_OUT') {
      showNotAuthenticated();
      window.location.href = 'index.html';
    }
  });
});

