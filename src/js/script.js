((docm) => {
	let books = [];
	const UPDATE_UI = new Event('update-ui');
	const storageKey = 'book-datas-in-storage';

	const updateUI = () => {
		docm.body.dispatchEvent(UPDATE_UI);
		saveToStorage();
	};

	const checkForStorage = () => (typeof Storage === 'function' ? true : false);

	const saveToStorage = () => {
		if (checkForStorage()) {
			localStorage.setItem(storageKey, JSON.stringify(books));
			docm.body.dispatchEvent(UPDATE_UI);
		}
	};

	const loadDataFromStorage = () => {
		if (checkForStorage()) {
			if (books.length === 0 && localStorage.getItem(storageKey) !== null) {
				books = JSON.parse(localStorage.getItem(storageKey));
			}
			updateUI();
		}
	};

	const showAlert = (message, type) => {
		if (type === 'successAlert') {
			const Toast = Swal.mixin({
				toast: true,
				position: 'top-end',
				showConfirmButton: false,
				timer: 2000,
				timerProgressBar: true,
				didOpen: (toast) => {
					toast.addEventListener('mouseenter', Swal.stopTimer);
					toast.addEventListener('mouseleave', Swal.resumeTimer);
				},
			});

			Toast.fire({
				icon: 'success',
				iconColor: '#42c2ff',
				title: message,
			});
		} else {
			return Swal.fire({
				title: 'Peringatan',
				text: message,
				icon: 'warning',
				showConfirmButton: true,
				confirmButtonText: 'Yakin',
				showCancelButton: true,
				cancelButtonText: 'Batal',
			});
		}
	};

	const makeAlert = (typeAlert) => {
		const audio = docm.querySelector('audio');

		switch (typeAlert) {
			case 'successAddedToShelf':
				showAlert('Obat Telah Berhasil Ditambahkan Ke Dalam Rak.', 'successAlert');
				break;
			case 'successUpdate':
				showAlert('Obat Telah Berhasil Diperbaharui', 'successAlert');
				break;
			case 'moveToUncompletedShelf':
				showAlert('Obat Berhasil Dipindahkan Ke Dalam Rak Belum Selesai Ditambah.', 'successAlert');
				break;
			case 'moveToCompletedShelf':
				showAlert('Obat Berhasil Dipindahkan Ke Dalam Rak Telah Selesai Ditambah', 'successAlert');
				break;
			case 'deleteBookFromShelf':
				showAlert('Obat Berhasil Dihapus Dari Rak', 'successAlert');
				break;
		}
		audio.currentTime = 0;
		audio.play();
	};

	const searchBooks = (keyword) => {
		if (keyword !== '') {
			for (const book of docm.querySelectorAll('.book')) {
				for (const word of keyword.trim().split(' ')) {
					if (book.firstElementChild.innerText.split(' ').includes(word)) {
						book.style.display = 'block';
					} else {
						book.style.display = 'none';
					}
				}
			}

			const displayBooks = [];

			for (const book of docm.querySelectorAll('.book')) {
				displayBooks.push(book.style.display);
			}

			const isNone = displayBooks.every((value) => {
				return value === 'none';
			});

			if (isNone) {
				alert('Obat yang anda cari tidak ada, mungkin ada belum memasukkannya atau sudah terhapus.');
				searchBooks('');
			}
		} else {
			for (const book of docm.querySelectorAll('.book')) {
				book.style.display = 'block';
			}
		}
	};

	const makeBookItem = (bookObject) => {
		const bookItem = docm.createElement('div');
		bookItem.className = 'book';

		const title = docm.createElement('h3');
		title.className = 'title';
		title.innerText = bookObject.title;

		const id = docm.createElement('p');
		id.className = 'book-id';
		id.innerText = bookObject.id;

		const author = docm.createElement('p');
		author.className = 'author';
		author.innerText = bookObject.author;

		const year = docm.createElement('p');
		year.className = 'year';
		year.innerText = bookObject.year;

		const actionButtons = docm.createElement('action-buttons');
		actionButtons.className = 'action-buttons';

		const deleteBook = docm.createElement('button');
		deleteBook.title = 'hapus obat';
		deleteBook.className = 'delete-book-button';
		deleteBook.innerHTML = '<i class="fa-solid fa-trash-can"></i>';

		deleteBook.addEventListener('click', function () {
			const confirmToUser = showAlert('Apakah anda yakin ingin menghapus  ini? ', 'confirmAlert');
			confirmToUser.then((SweetAlertResult) => {
				if (SweetAlertResult.isConfirmed) deleteBookFromShelf(bookObject.id);
			});
		});

		const updateBookButton = docm.createElement('button');
		updateBookButton.title = 'perbarui obat';
		updateBookButton.className = 'update-book-button';
		updateBookButton.innerHTML = '<i class="fa-solid fa-pen-to-square"><i/>';

		updateBookButton.addEventListener('click', function () {
			updateBook(bookObject.id);
		});

		if (bookObject.isComplete == false) {
			const unCompletedReadButton = docm.createElement('button');
			unCompletedReadButton.className = 'uncompleted-read';
			unCompletedReadButton.innerHTML = '<span>Selesai Ditambah</span>';
			actionButtons.append(unCompletedReadButton, deleteBook, updateBookButton);

			unCompletedReadButton.addEventListener('click', function () {
				moveToCompletedShelf(bookObject.id);
			});
		} else {
			const completedReadButton = docm.createElement('button');
			completedReadButton.className = 'completed-read';
			completedReadButton.innerHTML = '<span>Belum Selesai Ditambah</span>';
			actionButtons.append(completedReadButton, deleteBook, updateBookButton);

			completedReadButton.addEventListener('click', function () {
				moveToUncompletedShelf(bookObject.id);
			});
		}

		bookItem.append(title, id, author, year, actionButtons);

		return bookItem;
	};

	const updateBook = (bookId) => {
		const book = books.filter((value) => value.id === bookId)[0];
		const updateBookContainer = docm.querySelector('.update-book');
		const updateForm = docm.getElementById('update-form');
		updateForm.innerHTML = makeFormElements(book);
		updateBookContainer.style.display = 'flex';
		docm.body.style.overflow = 'hidden';

		updateForm.onsubmit = (e) => {
			e.preventDefault();
			updateBookValue(book, updateBookContainer);
		};

		docm.getElementById('close').addEventListener('click', () => hideModal(updateBookContainer));
	};

	const hideModal = (updateBookContainer) => {
		updateBookContainer.style.display = 'none';
		docm.body.style.overflow = 'auto';
	};

	const updateBookValue = (book, updateBookContainer) => {
		book.title = docm.getElementById('title').value;
		book.author = docm.getElementById('author').value;
		book.year = docm.getElementById('year').value;
		book.isComplete = docm.getElementById('isRead').checked;

		hideModal(updateBookContainer);
		makeAlert('successUpdate');
		updateUI();
	};

	const makeFormElements = (book) => {
		return `
					<div class="form-element">
            <label for="title">Judul Obat</label>
            <input type="text" name="title" id="title" maxlength="50" value="${book.title}" 
						required>
          </div>
          <div class="form-element">
            <label for="author">Penulis</label>
            <input type="text" id="author" name="author" value="${book.author}" maxlength="100" required>
          </div>
          <div class="form-element">
            <label for="year">Tahun Penerimaan</label>
            <input type="date" id="year" value="${book.year}" name="year" required>
          </div>
          <div class="form-element">
            <input type="checkbox" id="isRead" name="isRead" ${checkboxValue(book)}>
            <label for="isRead">Telah selesai ditambah</label>
          </div>
          <div class="form-element">
            <button id="close" type="button">Keluar</button>
            <button type="submit">Perbarui Obat</button>
          </div>`;
	};

	const checkboxValue = (book) => (book.isComplete === false ? '' : 'checked');

	const moveToUncompletedShelf = (bookId) => {
		for (const book of books) {
			if (bookId === book.id) book.isComplete = false;
		}
		makeAlert('moveToUncompletedShelf');
		updateUI();
	};

	const moveToCompletedShelf = (bookId) => {
		for (const book of books) {
			if (book.id == bookId) book.isComplete = true;
		}
		makeAlert('moveToCompletedShelf');
		updateUI();
	};

	const deleteBookFromShelf = (bookId) => {
		for (const index in books) {
			if (books[index].id === bookId) books.splice(index, 1);
		}

		makeAlert('deleteBookFromShelf');
		updateUI();
	};

	function renderBooks() {
		const unCompeletedBookShelf = docm.querySelector('.uncompleted-books-shelf');
		const completedBookShelf = docm.querySelector('.completed-books-shelf');
		unCompeletedBookShelf.innerHTML = '';
		completedBookShelf.innerHTML = '';

		for (const book of books) {
			book.isComplete === false ? unCompeletedBookShelf.append(makeBookItem(book)) : completedBookShelf.append(makeBookItem(book));
		}

		if (unCompeletedBookShelf.innerHTML == '') {
			unCompeletedBookShelf.innerHTML = '<p style="text-align: center;">Tidak terdapat obat yang <b>belum selesai ditambah</b>.</p>';
		}

		if (completedBookShelf.innerHTML == '') {
			completedBookShelf.innerHTML = '<p style="text-align: center;">Tidak terdapat obat yang <b>telah selesai ditambah</b>.</p>';
		}
	}

	docm.body.addEventListener('update-ui', renderBooks);

	docm.addEventListener('DOMContentLoaded', function () {
		const addForm = docm.getElementById('addForm');
		const searchKeywordButton = docm.getElementById('search-keyword-button');
		loadDataFromStorage();

		addForm.addEventListener('submit', function (event) {
			event.preventDefault();

			const bookTitle = docm.getElementById('judul-obat').value;
			const author = docm.getElementById('penulis').value;
			const year = docm.getElementById('tahun-penerimaan').value;
			const isComplete = docm.getElementById('isComplete').checked;

			books.push({
				id: +new Date(),
				title: bookTitle,
				author: author,
				year: year,
				isComplete: isComplete,
			});

			makeAlert('successAddedToShelf');
			updateUI();
		});

		searchKeywordButton.addEventListener('click', function () {
			const searchKeyword = docm.getElementById('search-keyword').value;
			searchBooks(searchKeyword);
		});

		docm.getElementById('search-keyword').addEventListener('keypress', function (event) {
			if (event.key === 'Enter') {
				searchKeywordButton.click();
			}
		});
	});
})(document);
