// ======================================
// VISTA PREVIA DE IMAGEN
// ======================================

const inputFoto = document.getElementById('foto-evidencia');
const preview = document.getElementById('preview-foto');
const imgPreview = document.getElementById('img-preview');
const nombreFoto = document.getElementById('nombre-foto');

inputFoto.addEventListener('change', function () {
    const archivo = this.files[0];

    if (!archivo) return;

    nombreFoto.textContent = archivo.name;
    imgPreview.src = URL.createObjectURL(archivo);
    preview.hidden = false;
});

document.getElementById('quitar-foto').addEventListener('click', function () {
    inputFoto.value = '';
    preview.hidden = true;
    imgPreview.src = '';
});


// ======================================
// NAVEGACIÓN FORMULARIO / CALENDARIO
// ======================================

const formContent = document.querySelector('.form-content');
const calendarContent = document.getElementById('calendarContent');

const openCalendar = document.getElementById('openCalendar');
const backToForm = document.getElementById('backToForm');

const steps = document.querySelectorAll('.sidebar .step');
const calendarFrame = document.getElementById('calendarFrame');


// ABRIR CALENDARIO

openCalendar.addEventListener('click', function () {

    formContent.hidden = true;
    calendarContent.hidden = false;

    // Paso 1 oscurecido
    steps[0].classList.remove('active');

    // Paso 2 resaltado
    steps[1].classList.add('active');

    // Ajustar el calendario cuando ya sea visible
    requestAnimationFrame(function () {
        ajustarCalendario();
        calendarContent.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});


// REGRESAR AL FORMULARIO

backToForm.addEventListener('click', function () {

    calendarContent.hidden = true;
    formContent.hidden = false;

    // Restaurar paso 1
    steps[1].classList.remove('active');
    steps[0].classList.add('active');

    formContent.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});


// AJUSTAR ALTURA DEL IFRAME

function ajustarCalendario() {
    try {
        const documento = calendarFrame.contentDocument;

        if (documento && documento.documentElement) {
            const altura = documento.documentElement.scrollHeight;
            calendarFrame.style.height = (altura + 30) + 'px';
        }
    } catch (error) {
        console.log('No se pudo ajustar la altura del calendario.');
    }
}

calendarFrame.addEventListener('load', ajustarCalendario);

window.addEventListener('resize', ajustarCalendario);