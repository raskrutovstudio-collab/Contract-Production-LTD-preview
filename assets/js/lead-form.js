(() => {
  const configuredEndpoint = window.LEAD_FORM_ENDPOINT || window.SITE_CONFIG?.leadEndpoint || '';
  const LEAD_FORM_ENDPOINT = configuredEndpoint === 'ТРЕБУЕТ_ПОДТВЕРЖДЕНИЯ' ? '' : configuredEndpoint;
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const namePattern = /^[\p{L}\s-]{2,80}$/u;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phonePattern = /^[+()\d\s-]+$/;
  const modal = document.getElementById('lead-modal');
  const dialog = modal?.querySelector('.lead-modal-dialog');
  let opener = null;

  function captureUtm() {
    const params = new URLSearchParams(location.search);
    utmKeys.forEach((key) => {
      const value = params.get(key);
      if (value) sessionStorage.setItem(key, value);
    });
  }

  function readUtm() {
    return Object.fromEntries(utmKeys.map((key) => [key, sessionStorage.getItem(key) || '']));
  }

  function fieldError(form, field) {
    const errorId = field?.getAttribute('aria-describedby');
    return errorId ? form.querySelector(`#${errorId}`) : null;
  }

  function clearFieldError(form, field) {
    if (!field) return;
    field.removeAttribute('aria-invalid');
    const error = fieldError(form, field);
    if (!error) return;
    error.hidden = true;
    error.textContent = '';
  }

  function clearErrors(form) {
    form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach((error) => {
      error.hidden = true;
      error.textContent = '';
    });
    const status = form.querySelector('[data-form-status]');
    if (!status) return;
    status.replaceChildren();
    status.classList.remove('is-error', 'is-success');
  }

  function showError(form, fieldName, message) {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return null;
    field.setAttribute('aria-invalid', 'true');
    const error = fieldError(form, field);
    if (error) {
      error.hidden = false;
      error.textContent = message;
    }
    return field;
  }

  function digitsCount(value) {
    return (value.match(/\d/g) || []).length;
  }

  function validate(form) {
    const name = String(new FormData(form).get('name') || '').trim().replace(/\s+/g, ' ');
    const phone = String(new FormData(form).get('phone') || '').trim();
    const email = String(new FormData(form).get('email') || '').trim();
    let firstInvalid = null;

    const mark = (fieldName, message) => {
      const field = showError(form, fieldName, message);
      if (!firstInvalid && field) firstInvalid = field;
    };

    if (!namePattern.test(name)) mark('name', 'Укажите ваше имя');
    if (!phonePattern.test(phone) || digitsCount(phone) < 10) mark('phone', 'Укажите корректный номер телефона');
    if (email && !emailPattern.test(email)) mark('email', 'Проверьте адрес электронной почты');
    if (!form.querySelector('[name="consent"]')?.checked) mark('consent', 'Подтвердите согласие на обработку данных');

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function showFallback(form) {
    const status = form.querySelector('[data-form-status]');
    if (!status) return;
    const phone = document.createElement('a');
    const email = document.createElement('a');
    phone.href = 'tel:+77055220000';
    phone.textContent = '+7 705 522 00 00';
    email.href = 'mailto:info@res.com.kz';
    email.textContent = 'info@res.com.kz';
    status.classList.add('is-error');
    status.replaceChildren(
      'Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами:',
      document.createElement('br'),
      phone,
      ' ',
      email
    );
  }

  function showSuccess(form) {
    const status = form.querySelector('[data-form-status]');
    if (!status) return;
    status.classList.add('is-success');
    status.textContent = 'Спасибо! Заявка отправлена. Мы свяжемся с вами, чтобы уточнить детали.';
  }

  function setSubmitting(form, isSubmitting) {
    const submit = form.querySelector('[type="submit"]');
    form.dataset.submitting = isSubmitting ? 'true' : 'false';
    if (!submit) return;
    if (isSubmitting) {
      submit.dataset.label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Отправляем…';
      return;
    }
    submit.disabled = false;
    if (submit.dataset.label) submit.textContent = submit.dataset.label;
  }

  function buildPayload(form) {
    const data = new FormData(form);
    const message = String(data.get('message') || '').trim().slice(0, 1500);
    const payload = {
      name: String(data.get('name') || '').trim().replace(/\s+/g, ' '),
      phone: String(data.get('phone') || '').trim(),
      email: String(data.get('email') || '').trim(),
      message,
      solution: String(data.get('solution') || '').trim(),
      source: String(data.get('source') || '').trim(),
      consent: 'yes',
      form_name: form.dataset.formName || '',
      page_url: location.href,
      page_title: document.title,
      referrer: document.referrer || '',
      ...readUtm()
    };
    if (form.querySelector('[name="company"]')) {
      payload.company = String(data.get('company') || '').trim();
    }
    return payload;
  }

  async function submitForm(form) {
    if (form.dataset.submitting === 'true') return;
    clearErrors(form);
    if (!validate(form)) return;
    if (String(new FormData(form).get('website') || '').trim()) return;

    if (!LEAD_FORM_ENDPOINT) {
      showFallback(form);
      return;
    }

    const sourceValue = String(new FormData(form).get('source') || '');
    setSubmitting(form, true);

    try {
      const response = await fetch(LEAD_FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(buildPayload(form))
      });

      if (!response.ok) throw new Error('Lead request failed');

      form.reset();
      const source = form.querySelector('[name="source"]');
      if (source) source.value = sourceValue;
      showSuccess(form);
      document.dispatchEvent(new CustomEvent('lead:success', {
        bubbles: true,
        detail: { formName: form.dataset.formName || '' }
      }));
    } catch {
      showFallback(form);
    } finally {
      setSubmitting(form, false);
    }
  }

  function bindForm(form) {
    if (form.dataset.handlerBound === 'true') return;
    form.dataset.handlerBound = 'true';

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitForm(form);
    });

    form.addEventListener('input', (event) => {
      const field = event.target;
      if (!(field instanceof HTMLElement) || !field.getAttribute('name')) return;
      clearFieldError(form, field);
    });
  }

  function focusableElements() {
    if (!dialog) return [];
    return [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')]
      .filter((element) => element.tabIndex !== -1 && !element.closest('.form-honeypot'));
  }

  function openModal(trigger) {
    if (!modal || !dialog) return;
    opener = trigger;
    const form = modal.querySelector('form');
    const source = form?.querySelector('[name="source"]');
    if (source) source.value = trigger.getAttribute('data-lead-source') || '';
    if (form) clearErrors(form);
    modal.hidden = false;
    modal.inert = false;
    document.body.classList.add('lead-modal-open');
    modal.querySelector('.lead-modal__close')?.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    const form = modal.querySelector('form');
    const returnTarget = opener;
    if (form) clearErrors(form);
    modal.hidden = true;
    modal.inert = true;
    document.body.classList.remove('lead-modal-open');
    opener = null;
    if (returnTarget instanceof HTMLElement) returnTarget.focus();
  }

  captureUtm();
  document.querySelectorAll('[data-lead-form]').forEach(bindForm);

  document.querySelectorAll('[data-open-lead-modal]').forEach((trigger) => {
    trigger.addEventListener('click', () => openModal(trigger));
  });

  modal?.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest('[data-close-lead-modal]')) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!modal || modal.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;
    const items = focusableElements();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, true);
})();
