let notebookData = {
    pages: []
};

let currentPage = 0;
let quillLeft, quillRight;

const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['image'],
    ['clean']
];

$("body").hide();

function initQuill() {
    const quillOptions = {
        theme: 'snow',
        modules: {
            toolbar: toolbarOptions
        },
        bounds: '.page'
    };

    quillLeft = new Quill('#editor-left', quillOptions);
    quillRight = new Quill('#editor-right', quillOptions);

    quillLeft.on('text-change', () => updatePageContent(currentPage, quillLeft.root.innerHTML));
    quillRight.on('text-change', () => updatePageContent(currentPage + 1, quillRight.root.innerHTML));

    const insertImage = () => {
        const activeQuill = quillLeft.hasFocus() ? quillLeft : quillRight;
        
        showImageUrlInput((url) => {
            if (url) {
                const range = activeQuill.getSelection(true);
                activeQuill.insertEmbed(range.index, 'image', url, Quill.sources.USER);
            }
        });
    };

    quillLeft.getModule('toolbar').addHandler('image', insertImage);
    quillRight.getModule('toolbar').addHandler('image', insertImage);

    quillLeft.on('selection-change', function(range, oldRange, source) {
        if (range) {
            quillLeft.hasFocus = function() { return true; };
            quillRight.hasFocus = function() { return false; };
        }
    });

    quillRight.on('selection-change', function(range, oldRange, source) {
        if (range) {
            quillLeft.hasFocus = function() { return false; };
            quillRight.hasFocus = function() { return true; };
        }
    });
}

function showImageUrlInput(callback) {
    const inputContainer = document.createElement('div');
    inputContainer.style.position = 'absolute';
    inputContainer.style.top = '50%';
    inputContainer.style.left = '50%';
    inputContainer.style.transform = 'translate(-50%, -50%)';
    inputContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    inputContainer.style.padding = '20px';
    inputContainer.style.borderRadius = '5px';
    inputContainer.style.zIndex = '1000';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter image URL';
    input.style.width = '300px';
    input.style.padding = '5px';
    input.style.marginBottom = '10px';

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Insert Image';
    submitButton.style.marginRight = '10px';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';

    inputContainer.appendChild(input);
    inputContainer.appendChild(submitButton);
    inputContainer.appendChild(cancelButton);

    document.body.appendChild(inputContainer);

    submitButton.onclick = () => {
        const url = input.value.trim();
        document.body.removeChild(inputContainer);
        callback(url);
    };

    cancelButton.onclick = () => {
        document.body.removeChild(inputContainer);
        callback(null);
    };

    input.focus();
}

function initNotebook() {
    for (let i = 0; i < 20; i++) {
        notebookData.pages.push({ content: '', number: i + 1 });
    }
}

function renderPages() {
    const leftPageNumber = document.getElementById('left-page-number');
    const rightPageNumber = document.getElementById('right-page-number');

    if (currentPage < notebookData.pages.length) {
        quillLeft.root.innerHTML = notebookData.pages[currentPage].content;
        leftPageNumber.textContent = notebookData.pages[currentPage].number;
    } else {
        quillLeft.root.innerHTML = '';
        leftPageNumber.textContent = '';
    }

    if (currentPage + 1 < notebookData.pages.length) {
        quillRight.root.innerHTML = notebookData.pages[currentPage + 1].content;
        rightPageNumber.textContent = notebookData.pages[currentPage + 1].number;
    } else {
        quillRight.root.innerHTML = '';
        rightPageNumber.textContent = '';
    }
}

function saveNotebook() {
    console.log('Saving notebook:', JSON.stringify(notebookData));
    $.post('https://Shatner_Notebooks/saveNotebook', JSON.stringify(notebookData))
        .done(function(response) {
            console.log('Save response:', response);
        })
        .fail(function(error) {
            console.error('Error saving notebook:', error);
        });
}

function updatePageContent(pageIndex, content) {
    if (pageIndex < notebookData.pages.length) {
        notebookData.pages[pageIndex].content = content;
        debouncedSaveNotebook();
    }
}

function turnPage(direction) {
    if (direction === 'next' && currentPage < notebookData.pages.length - 2) {
        currentPage += 2;
    } else if (direction === 'prev' && currentPage > 0) {
        currentPage -= 2;
    }
    renderPages();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedSaveNotebook = debounce(saveNotebook, 1000);

let isDragging = false;
let startX;

function handleDragStart(e) {
    isDragging = true;
    startX = e.clientX || e.touches[0].clientX;
}

function handleDragMove(e) {
    if (!isDragging) return;

    const currentX = e.clientX || e.touches[0].clientX;
    const diff = currentX - startX;

    if (Math.abs(diff) > 50) {
        if (diff > 0 && currentPage > 0) {
            turnPage('prev');
        } else if (diff < 0 && currentPage < notebookData.pages.length - 2) {
            turnPage('next');
        }
        isDragging = false;
    }
}

function handleDragEnd() {
    isDragging = false;
}

document.getElementById('left-corner').addEventListener('mousedown', handleDragStart);
document.getElementById('right-corner').addEventListener('mousedown', handleDragStart);
document.getElementById('left-corner').addEventListener('touchstart', handleDragStart);
document.getElementById('right-corner').addEventListener('touchstart', handleDragStart);

document.addEventListener('mousemove', handleDragMove);
document.addEventListener('touchmove', handleDragMove);

document.addEventListener('mouseup', handleDragEnd);
document.addEventListener('touchend', handleDragEnd);

document.getElementById('save').addEventListener('click', saveNotebook);

document.getElementById('close').addEventListener('click', () => {
    console.log("Close button clicked");
    $("body").hide();
    $.post('https://Shatner_Notebooks/closeNotebook', JSON.stringify({}))
        .done(function(response) {
            console.log('Response from closeNotebook:', response);
        })
        .fail(function(error) {
            console.error('Error in closeNotebook:', error);
        });
});

window.addEventListener('message', (event) => {
    if (event.data.type === 'openNotebook') {
        console.log('Received openNotebook message:', event.data);
        notebookData = event.data.data || { pages: [] };
        if (notebookData.pages.length === 0) {
            initNotebook();
        }
        currentPage = 0;
        renderPages();
        $("body").show();
        console.log("Notebook UI opened and visible");
    } else if (event.data.type === 'closeNotebook') {
        $("body").hide();
        console.log("Notebook UI closed and hidden");
    } else if (event.data.type === 'saveNotebookResponse') {
        if (event.data.success) {
            console.log('Notebook saved successfully');
        } else {
            console.error('Failed to save notebook:', event.data.error);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initQuill();
    initNotebook();
    renderPages();
});