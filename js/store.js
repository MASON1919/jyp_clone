async function loadStore(){
    try{
        const response = await fetch('https://fakestoreapi.com/products');
        const items = await response.json();
        if (!response.ok) {
            throw new Error(`status: ${response.status}`);
        }
        return items;
    }
    catch(error){
        console.log(error);
        return null;
    }
}
console.log(loadStore());