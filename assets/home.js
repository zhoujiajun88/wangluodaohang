(() => {
    const grid = document.getElementById('toolGrid');
    const toggle = document.getElementById('sortToggle');
    const reset = document.getElementById('resetOrder');
    const status = document.getElementById('orderStatus');
    const defaultCards = Array.from(grid.children);
    const cookieName = 'toolOrder';
    const count = document.querySelector('.tool-count');
    count.textContent = String(defaultCards.length).padStart(2, '0');
    count.setAttribute('aria-label', `${defaultCards.length} 个工具`);

    function announce(message) {
        status.textContent = message;
    }

    function saveOrder() {
        const order = Array.from(grid.children, card => card.dataset.toolId).join(',');
        try {
            document.cookie = `${cookieName}=${encodeURIComponent(order)}; max-age=31536000; path=/; SameSite=Lax`;
            announce('排序已保存');
        } catch {
            announce('当前浏览器无法保存排序');
        }
        updateButtons();
    }

    // Ignore old, unknown or duplicate IDs while keeping newly added tools visible.
    try {
        const cookie = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`));
        if (cookie) {
            const cards = new Map(defaultCards.map(card => [card.dataset.toolId, card]));
            decodeURIComponent(cookie.slice(cookieName.length + 1)).split(',').forEach(id => {
                if (!cards.has(id)) return;
                grid.appendChild(cards.get(id));
                cards.delete(id);
            });
            cards.forEach(card => grid.appendChild(card));
        }
    } catch {
        // A malformed or unavailable cookie must not hide the directory.
    }

    function iconButton(icon, label, className) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `icon-button ${className}`;
        button.setAttribute('aria-label', label);
        button.dataset.tooltip = label;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', `assets/icons.svg#${icon}`);
        svg.appendChild(use);
        button.appendChild(svg);
        return button;
    }

    function updateButtons() {
        const cards = Array.from(grid.children);
        cards.forEach((card, index) => {
            card.querySelector('.move-up').disabled = index === 0;
            card.querySelector('.move-down').disabled = index === cards.length - 1;
        });
    }

    function moveCard(card, direction) {
        const sibling = direction < 0 ? card.previousElementSibling : card.nextElementSibling;
        if (!sibling) return;
        grid.insertBefore(card, direction < 0 ? sibling : sibling.nextElementSibling);
        saveOrder();
        card.querySelector('.drag-handle').focus();
        announce(`${card.querySelector('strong').textContent}已移至第 ${Array.from(grid.children).indexOf(card) + 1} 位，排序已保存`);
    }

    defaultCards.forEach(card => {
        const name = card.querySelector('strong').textContent;
        const controls = document.createElement('div');
        controls.className = 'sort-controls';
        const up = iconButton('chevron-up', `前移 ${name}`, 'move-button move-up');
        const handle = iconButton('grip-vertical', `调整 ${name} 的位置`, 'drag-handle');
        const down = iconButton('chevron-down', `后移 ${name}`, 'move-button move-down');
        up.addEventListener('click', () => moveCard(card, -1));
        down.addEventListener('click', () => moveCard(card, 1));
        handle.addEventListener('click', () => setSorting(true));
        handle.addEventListener('keydown', event => {
            if (!['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.key)) return;
            event.preventDefault();
            setSorting(true);
            moveCard(card, ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1);
        });
        controls.append(up, handle, down);
        card.appendChild(controls);
    });

    function setSorting(enabled) {
        document.body.classList.toggle('is-sorting', enabled);
        toggle.setAttribute('aria-pressed', String(enabled));
        const label = enabled ? '完成排序' : '调整排序';
        toggle.setAttribute('aria-label', label);
        toggle.dataset.tooltip = label;
        reset.hidden = !enabled;
    }

    toggle.addEventListener('click', () => setSorting(toggle.getAttribute('aria-pressed') !== 'true'));
    reset.addEventListener('click', () => {
        defaultCards.forEach(card => grid.appendChild(card));
        saveOrder();
        announce('已恢复默认排序');
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-pressed') === 'true') {
            setSorting(false);
            toggle.focus();
        }
    });
    if (window.Sortable) {
        new Sortable(grid, {
            handle: '.drag-handle',
            draggable: '.card',
            animation: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            fallbackTolerance: 5,
            onEnd: saveOrder
        });
    }
    updateButtons();
    document.querySelector('.order-actions').hidden = false;
})();
