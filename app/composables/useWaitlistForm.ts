import { ref, computed } from 'vue';

export function useWaitlistForm() {
  const supabase = useSupabaseClient();
  const email = ref('');
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
  const message = ref('');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const canSubmit = computed(() => {
    const e = email.value.trim();
    return e.length > 3 && e.length <= 254 && emailPattern.test(e);
  });

  async function submit() {
    if (!canSubmit.value || status.value === 'loading') return;
    status.value = 'loading';
    message.value = '';

    const normalized = email.value.trim().toLowerCase();
    const { error } = await supabase.from('waitlist_signups').insert({ email: normalized });

    if (!error) {
      status.value = 'success';
      email.value = '';
      return;
    }

    status.value = 'error';
    message.value = error.code === '23505'
      ? 'That email is already on the waitlist.'
      : error.message || 'Something went wrong. Please try again.';
  }

  return {
    email,
    status,
    message,
    canSubmit,
    submit,
  };
}
