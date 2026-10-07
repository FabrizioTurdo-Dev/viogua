// Aparición al scrollear: [data-revelar] recibe .visto la primera vez que entra en pantalla.
// Lo que ya está a la vista cuando arranca el script se marca visto antes de activar la clase
// .revela en <html>, así no parpadea; sin JS (o si falla) todo queda visible.
const elementos = [...document.querySelectorAll<HTMLElement>('[data-revelar]')];
const alto = innerHeight;
const pendientes = elementos.filter(el => {
  const caja = el.getBoundingClientRect();
  const visible = caja.top < alto * 0.92 && caja.bottom > 0;
  if (visible) el.classList.add('visto', 'ya'); // ya estaba a la vista: sin animación
  return !visible;
});

if ('IntersectionObserver' in window && pendientes.length) {
  document.documentElement.classList.add('revela');
  const io = new IntersectionObserver(
    entradas => {
      for (const en of entradas) {
        if (!en.isIntersecting) continue;
        en.target.classList.add('visto');
        io.unobserve(en.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  pendientes.forEach(el => io.observe(el));
} else elementos.forEach(el => el.classList.add('visto'));
