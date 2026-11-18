/* Plastikkimik Pytangy · comportamento do cliente */
(function () {
  'use strict';

  const root = document.documentElement;
  const STORAGE_THEME = 'pytangy.theme';
  const STORAGE_SIDEBAR = 'pytangy.sidebar';

  /* ---------------- Tema claro/escuro ---------------- */
  function paintThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute('content', root.getAttribute('data-bs-theme') === 'dark' ? '#121110' : '#faf9f7');
  }

  function applyTheme(theme, persist) {
    const next = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-bs-theme', next);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_THEME, next);
      } catch (error) {
        /* armazenamento indisponível */
      }
    }
    paintThemeColor();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(next === 'dark'));
      button.setAttribute('aria-label', next === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
    });
  }

  paintThemeColor();

  document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark', true);
    });
  });

  /* ---------------- Sidebar recolhível ---------------- */
  const desktopQuery = window.matchMedia('(min-width: 992px)');

  function paintSidebar(collapsed) {
    document.body.classList.toggle('sidebar-collapsed', collapsed && desktopQuery.matches);
    document.querySelectorAll('[data-sidebar-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(collapsed));
    });
  }

  let sidebarCollapsed = false;
  try {
    sidebarCollapsed = localStorage.getItem(STORAGE_SIDEBAR) === 'collapsed';
  } catch (error) {
    sidebarCollapsed = false;
  }

  if (desktopQuery.matches) paintSidebar(sidebarCollapsed);

  document.querySelectorAll('[data-sidebar-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      sidebarCollapsed = !sidebarCollapsed;
      paintSidebar(sidebarCollapsed);
      try {
        localStorage.setItem(STORAGE_SIDEBAR, sidebarCollapsed ? 'collapsed' : 'expanded');
      } catch (error) {
        /* armazenamento indisponível */
      }
    });
  });

  desktopQuery.addEventListener('change', function () {
    paintSidebar(sidebarCollapsed);
  });

  /* ---------------- Mostrar/ocultar senha ---------------- */
  document.querySelectorAll('[data-toggle-password]').forEach(function (button) {
    button.addEventListener('click', function () {
      const input = document.getElementById(button.getAttribute('data-toggle-password'));
      if (!input) return;
      const showing = input.getAttribute('type') === 'text';
      input.setAttribute('type', showing ? 'password' : 'text');
      button.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
      const icon = button.querySelector('i');
      if (icon) icon.className = showing ? 'bi bi-eye' : 'bi bi-eye-slash';
    });
  });

  /* ---------------- Prévia do avatar ---------------- */
  const avatarInput = document.querySelector('[data-avatar-input]');
  if (avatarInput) {
    avatarInput.addEventListener('change', function () {
      const file = avatarInput.files && avatarInput.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return;

      const holder = document.querySelector('.profile-avatar-wrap .avatar');
      if (!holder) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        holder.innerHTML = '';
        const image = document.createElement('img');
        image.src = String(event.target.result);
        image.alt = 'Prévia da nova foto';
        holder.appendChild(image);
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------------- Formulário de lote ---------------- */
  const batchForm = document.querySelector('[data-batch-form]');
  if (batchForm) {
    const collectionSelect = batchForm.querySelector('[data-collection-select]');
    const weightInput = batchForm.querySelector('[data-weight-input]');
    const collectionHint = batchForm.querySelector('[data-collection-hint]');
    const yieldHint = batchForm.querySelector('[data-yield-hint]');

    const formatKg = function (value) {
      return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Number(value || 0)) + ' kg';
    };

    const refreshBatchForm = function () {
      const option = collectionSelect && collectionSelect.options[collectionSelect.selectedIndex];
      const petals = Number(option && option.dataset ? option.dataset.weight : 0) || 0;

      if (!petals) {
        if (collectionHint) collectionHint.textContent = 'As pétalas precisam já ter sido coletadas.';
        if (yieldHint) yieldHint.textContent = 'Selecione a coleta para simular o rendimento de 0,3 kg de bioplástico por kg de pétalas.';
        return;
      }

      if (collectionHint) {
        collectionHint.textContent = 'Coleta com ' + formatKg(petals) + ' de pétalas disponíveis.';
      }
      if (weightInput) {
        weightInput.max = String(petals);
      }
      if (yieldHint) {
        yieldHint.textContent =
          'Rendimento esperado: cerca de ' +
          formatKg(petals * 0.3) +
          ' de bioplástico a partir de ' +
          formatKg(petals) +
          ' de pétalas.';
      }
    };

    if (collectionSelect) collectionSelect.addEventListener('change', refreshBatchForm);
    refreshBatchForm();
  }

  /* ---------------- Formulário de pedido ---------------- */
  const orderForm = document.querySelector('[data-order-form]');
  if (orderForm) {
    const batchSelect = orderForm.querySelector('[data-batch-select]');
    const quantityInput = orderForm.querySelector('[data-quantity-input]');
    const batchHint = orderForm.querySelector('[data-batch-hint]');
    const impactHint = orderForm.querySelector('[data-impact-hint]');

    const formatKg = function (value) {
      return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Number(value || 0)) + ' kg';
    };

    const refreshOrderForm = function () {
      const option = batchSelect && batchSelect.options[batchSelect.selectedIndex];
      const available = Number(option && option.dataset ? option.dataset.available : 0) || 0;
      const quantity = Number(String(quantityInput && quantityInput.value ? quantityInput.value : '0').replace(',', '.')) || 0;

      if (!available) {
        if (batchHint) batchHint.textContent = 'Selecione o lote para ver o volume máximo disponível.';
      } else if (batchHint) {
        batchHint.textContent = 'Disponível neste lote: ' + formatKg(available) + '.';
        if (quantityInput) quantityInput.max = String(available);
      }

      if (impactHint) {
        if (!quantity) {
          impactHint.textContent = 'Informe a quantidade para estimar plástico fóssil e CO₂ evitados.';
        } else {
          const co2 = quantity * 3.2;
          const bags = Math.round(quantity / 0.005);
          impactHint.textContent =
            'Aproximadamente ' +
            formatKg(quantity) +
            ' de plástico fóssil evitado, ' +
            formatKg(co2) +
            ' de CO₂ e ' +
            new Intl.NumberFormat('pt-BR').format(bags) +
            ' sacolas de 5 g.';
        }
      }
    };

    if (batchSelect) batchSelect.addEventListener('change', refreshOrderForm);
    if (quantityInput) quantityInput.addEventListener('input', refreshOrderForm);
    refreshOrderForm();
  }

  /* ---------------- Flash: fechamento automático ---------------- */
  const flashAlerts = document.querySelectorAll('.flash-stack .alert');
  flashAlerts.forEach(function (alert) {
    window.setTimeout(function () {
      if (!alert.isConnected) return;
      alert.classList.remove('show');
      window.setTimeout(function () {
        const instance = window.bootstrap && window.bootstrap.Alert ? window.bootstrap.Alert.getOrCreateInstance(alert) : null;
        if (instance) instance.close();
        else alert.remove();
      }, 200);
    }, 6500);
  });

  /* ---------------- Encoding amigável de formulários ---------------- */
  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function () {
      const submit = form.querySelector('button[type="submit"]');
      if (!submit || submit.dataset.loading === '1') return;
      submit.dataset.loading = '1';
      window.setTimeout(function () {
        submit.dataset.loading = '';
      }, 4000);
    });
  });
})();
