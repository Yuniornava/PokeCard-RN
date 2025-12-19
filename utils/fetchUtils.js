// utils/fetchUtils.js
export const fetchConManejoErrores = async (url) => {
  try {
    const respuesta = await fetch(url, {
      headers: {
        'User-Agent': 'PokeCard-App/1.0',
        'Accept': 'application/json'
      }
    });

    // Si no es 200-299, lanza error
    if (!respuesta.ok) {
      // Para errores 404, solo devuelve null sin mostrar error
      if (respuesta.status === 404) {
        return null; // Esto evitará que se muestre el error en consola
      }
      throw new Error(`HTTP ${respuesta.status}: ${respuesta.statusText}`);
    }

    const contentType = respuesta.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null; // Si no es JSON, devuelve null
    }

    return await respuesta.json();
  } catch (error) {
    // NO imprimas el error aquí
    return null; // Simplemente devuelve null
  }
};

// Lista de IDs de Pokémon estándar (1-1025)
export const pokemonEstandarIds = Array.from({ length: 1025 }, (_, i) => i + 1);