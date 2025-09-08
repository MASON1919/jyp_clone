import '../node_modules/masonry-layout/dist/masonry.pkgd.min.js';
import '../node_modules/imagesloaded/imagesloaded.pkgd.min.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('image-container');

    const msnry = new Masonry(container, {
        itemSelector: '.gallery-item',
        percentPosition: true,
        gutter: 15
    });

    function displayFavorites() {
        const favorites = JSON.parse(localStorage.getItem('pexelsFavorites')) || [];

        if (favorites.length === 0) {
            container.innerHTML = '<p>즐겨찾기한 이미지가 없습니다.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        const allItems = [];
        favorites.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = photo.src.medium;
            img.alt = photo.alt;
            item.appendChild(img);

            const overlay = document.createElement('div');
            overlay.className = 'overlay';

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';
            
            const downloadLink = document.createElement('a');
            downloadLink.href = photo.src.original;
            downloadLink.setAttribute('download', `pexels-${photo.id}.jpg`);
            downloadLink.target = '_blank';
            downloadLink.innerHTML = '다운로드';
            
            const removeButton = document.createElement('button');
            removeButton.innerHTML = '즐겨찾기 해제';

            removeButton.addEventListener('click', () => {
                const currentFavorites = JSON.parse(localStorage.getItem('pexelsFavorites')) || [];
                const updatedFavorites = currentFavorites.filter(fav => fav.id !== photo.id);
                
                localStorage.setItem('pexelsFavorites', JSON.stringify(updatedFavorites));
                
                alert('즐겨찾기에서 삭제되었습니다.');
                msnry.remove(item);
                msnry.layout();
            });

            buttonContainer.appendChild(downloadLink);
            buttonContainer.appendChild(removeButton);
            overlay.appendChild(buttonContainer);
            item.appendChild(overlay);

            fragment.appendChild(item);
            allItems.push(item);
        });

        container.appendChild(fragment);
        const imgLoad = imagesLoaded(container);
        imgLoad.on('always', function() {
            msnry.reloadItems();
            msnry.layout();
            allItems.forEach(item => item.classList.add('is-visible'));
        });
    }

    displayFavorites();
});