import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator, 
  Easing,
  Animated,
  TextInput,
  Dimensions,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { fetchConManejoErrores, pokemonEstandarIds } from './utils/fetchUtils';
import { pokemonEspeciales } from './src/data/pokemonEspeciales';
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector
} from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [datos, setDatos] = useState(null);
  const [numero, setNumero] = useState(1);
  const [esshiny, setShiny] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);
  const [habilidades, setHabilidades] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [IsSearchOpen, setIsSearchOpen] = useState(false);
  const [Buscarpokemon, setBuscarPokemon] = useState('');
  const [busquedaActual, setBusquedaActual] = useState('');
  const [cargando, setCargando] = useState(false);
  const [generacion, setGeneracion] = useState(0);

  // Animaciones con animated
  const inputWidth = useRef(new Animated.Value(0)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const botonOpaco = useRef(new Animated.Value(1)).current;
  
  // Para animación de feedback de tap
  const imageScale = useRef(new Animated.Value(1)).current;
  const descripcionScale = useRef(new Animated.Value(1)).current;
  
  // Animaciones para movimiento de la carta y flechas
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const leftArrowOpacity = useRef(new Animated.Value(0)).current;
  const rightArrowOpacity = useRef(new Animated.Value(0)).current;
  const downArrowOpacity = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get('window').width;
  const maxInputWidth = screenWidth * 0.7;
  const SWIPE_THRESHOLD = 80;
  const VERTICAL_THRESHOLD = 120;

  // Función para obtener un Pokémon aleatorio (incluye formas especiales)
  const obtenerPokemonAleatorio = () => {
    const esEspecial = Math.random() < 0.3;
    
    if (esEspecial && pokemonEspeciales.length > 0) {
      const indiceAleatorio = Math.floor(Math.random() * pokemonEspeciales.length);
      return pokemonEspeciales[indiceAleatorio];
    } else {
      const indiceAleatorio = Math.floor(Math.random() * pokemonEstandarIds.length);
      return pokemonEstandarIds[indiceAleatorio];
    }
  };

  // Función para buscar pokemon
  const fetchNewPokemon = async (pokemon) => {
    if (cargando) return;
    
    setCargando(true);
    try {
      const id = isNaN(pokemon) ? pokemon.toString().toLowerCase().trim() : parseInt(pokemon);
      
      console.log(`Buscando Pokémon: ${id}`);
      const fetchdatos = await fetchConManejoErrores(`https://pokeapi.co/api/v2/pokemon/${id}`);
      
      // Si no se encontró el Pokémon
      if (!fetchdatos) {
        alert(`Pokémon no encontrado: "${pokemon}"\n\nIntenta con:\n• ID (1-1025)\n• Nombre en inglés\n• Formas especiales válidas\n\nEjemplos: "25", "pikachu", "charizard-mega-x"`);
        return;
      }
      
      setDatos(fetchdatos);
      setNumero(fetchdatos.id);
      setBusquedaActual(id.toString());
      
      if (fetchdatos.abilities) {
        await cargarHabilidades(fetchdatos.abilities);
      }

      await cargarDescripcionSoloEspanol(fetchdatos.id);
      
      closeSearch();
    } catch(error) {
      console.log("Error inesperado:", error);
    } finally {
      setCargando(false);
    }
  };

  // Función para resetear animaciones de la carta
  const resetCardAnimations = () => {
    Animated.parallel([
      Animated.spring(cardTranslateX, {
        toValue: 0,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Configurar gesto de pan (swipe) con feedback visual
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Resetear todas las animaciones al comenzar el gesto
      Animated.parallel([
        Animated.timing(leftArrowOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rightArrowOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(downArrowOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    })
    .onUpdate((event) => {
      const { translationX, translationY } = event;
      
      // Mover la carta según el gesto
      cardTranslateX.setValue(translationX);
      cardTranslateY.setValue(translationY > 0 ? translationY : 0); // Solo movimiento hacia abajo
      
      // Escalar la carta ligeramente cuando se mueve
      const scale = 1 - Math.abs(translationX) / 800;
      cardScale.setValue(Math.max(0.95, scale));
      
      // Mostrar flechas según la dirección
      if (Math.abs(translationX) > 20 && Math.abs(translationY) < 50) {
        if (translationX > 0) {
          // Deslizando a la derecha - mostrar flecha izquierda (retroceder)
          leftArrowOpacity.setValue(Math.min(translationX / SWIPE_THRESHOLD, 1));
          rightArrowOpacity.setValue(0);
          downArrowOpacity.setValue(0);
        } else {
          // Deslizando a la izquierda - mostrar flecha derecha (avanzar)
          rightArrowOpacity.setValue(Math.min(Math.abs(translationX) / SWIPE_THRESHOLD, 1));
          leftArrowOpacity.setValue(0);
          downArrowOpacity.setValue(0);
        }
      }
      
      // Mostrar flecha hacia abajo para aleatorio
      if (translationY > 30 && Math.abs(translationX) < 40) {
        downArrowOpacity.setValue(Math.min(translationY / VERTICAL_THRESHOLD, 1));
        leftArrowOpacity.setValue(0);
        rightArrowOpacity.setValue(0);
      }
    })
    .onEnd((event) => {
      const { translationX, translationY } = event;
      
      // Resetear flechas
      Animated.parallel([
        Animated.timing(leftArrowOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rightArrowOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(downArrowOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
      
      // Verificar si se superó el umbral del gesto
      if (Math.abs(translationX) > SWIPE_THRESHOLD && !cargando) {
        // Animación de deslizamiento para el cambio de Pokémon
        Animated.parallel([
          Animated.timing(cardTranslateX, {
            toValue: translationX > 0 ? 500 : -500,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 0.8,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Cambiar Pokémon
          if (translationX > 0) {
            // Swipe derecha - Pokémon anterior
            setNumero(numero <= 1 ? 1 : numero - 1);
          } else {
            // Swipe izquierda - Pokémon siguiente
            setNumero(numero + 1);
          }
          
          // Resetear posición de la carta
          resetCardAnimations();
        });
      } else if (translationY > VERTICAL_THRESHOLD && !cargando) {
        // Animación para swipe hacia abajo (aleatorio)
        Animated.parallel([
          Animated.timing(cardTranslateY, {
            toValue: 500,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 0.8,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Pokémon aleatorio
          let nuevoPokemon;
          do {
            nuevoPokemon = obtenerPokemonAleatorio();
          } while (nuevoPokemon.toString() === busquedaActual);
          
          fetchNewPokemon(nuevoPokemon);
          
          // Resetear posición de la carta
          resetCardAnimations();
        });
      } else {
        // Si no se superó el umbral, volver a la posición original
        resetCardAnimations();
      }
    });

  // Animación de feedback para tap
  const animarTap = (animatedValue) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Tap en imagen para cambiar sprite (ahora con un solo tap)
  const onImageTap = () => {
    animarTap(imageScale);
    const nextGen = generacion === 9 ? 0 : generacion + 1;
    setGeneracion(nextGen);
  };

  // Tap en descripción para cambiar entre descripciones en español
  const onDescripcionTap = () => {
    animarTap(descripcionScale);
    if (datos) {
      cargarDescripcionSoloEspanol(datos.id);
    }
  };

  const openSearch = () => {
    setIsSearchOpen(true);

    Animated.parallel([
      Animated.timing(inputWidth, {
        toValue: maxInputWidth,
        duration: 400,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: false,
      }),
      Animated.timing(inputOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(botonOpaco, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const closeSearch = () => {
    Animated.parallel([
      Animated.timing(inputWidth, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }),
      Animated.timing(inputOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(botonOpaco, {
        toValue: 1,
        duration: 300,
        delay: 100,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsSearchOpen(false);
      setBuscarPokemon('');
      Keyboard.dismiss();
    });
  };

  // Función para cargar y traducir habilidades
  const cargarHabilidades = async (abilities) => {
    const habilidadesTraducidas = [];
    
    for (const ability of abilities) {
      try {
        const data = await fetchConManejoErrores(ability.ability.url);
        
        const nombreEs = data.names?.find(n => n.language.name === 'es');
        
        habilidadesTraducidas.push({
          nombre: nombreEs ? nombreEs.name : ability.ability.name.replace(/-/g, ' '),
          oculta: ability.is_hidden
        });
      } catch (error) {
        habilidadesTraducidas.push({
          nombre: ability.ability.name.replace(/-/g, ' '),
          oculta: ability.is_hidden
        });
      }
    }
    
    setHabilidades(habilidadesTraducidas);
  };

  // Función para cargar la descripción SOLO en español (cambia entre diferentes versiones)
  const cargarDescripcionSoloEspanol = async (pokemonId) => {
    const data = await fetchConManejoErrores(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    
    // Si no hay datos de especie
    if (!data) {
      setDescripcion('No hay información de especie disponible para este Pokémon.');
      return;
    }
    
    // Obtener todas las entradas en español
    const entradasEspanol = data.flavor_text_entries?.filter(
      entry => entry.language.name === 'es'
    ) || [];
    
    if (entradasEspanol.length > 0) {
      // Si ya hay una descripción, buscar la siguiente
      if (descripcion && descripcion !== 'Cargando descripción...' && descripcion !== 'No hay descripción en español disponible.') {
        // Buscar el índice de la descripción actual
        const descripcionesLimpia = entradasEspanol.map(entry => 
          entry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ')
        );
        
        const currentIndex = descripcionesLimpia.indexOf(descripcion);
        const nextIndex = (currentIndex + 1) % descripcionesLimpia.length;
        
        setDescripcion(descripcionesLimpia[nextIndex]);
      } else {
        // Primera vez, usar la más reciente
        const versionesOrden = ['scarlet', 'violet', 'legends-arceus', 'brilliant-diamond', 
                                'shining-pearl', 'sword', 'shield', 'ultra-sun', 'ultra-moon',
                                'sun', 'moon', 'omega-ruby', 'alpha-sapphire', 'x', 'y',
                                'black-2', 'white-2', 'black', 'white', 'platinum',
                                'heartgold', 'soulsilver', 'diamond', 'pearl', 'emerald',
                                'ruby', 'sapphire', 'crystal', 'silver', 'gold', 'yellow',
                                'blue', 'red', 'firered', 'leafgreen'];
        
        const entradaReciente = entradasEspanol.sort((a, b) => {
          return versionesOrden.indexOf(b.version.name) - versionesOrden.indexOf(a.version.name);
        })[0];
        
        setDescripcion(entradaReciente.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' '));
      }
    } else {
      setDescripcion('No hay descripción en español disponible.');
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        // Cargar fuente
        await Font.loadAsync({
          'Pokemon-Classic': require('./assets/fonts/Pokemon-Classic.ttf'),
        });
        setFontLoaded(true);

        // Cargar Pokémon inicial
        const fetchdatos = await fetchConManejoErrores(`https://pokeapi.co/api/v2/pokemon/${numero}`);
        
        if (fetchdatos) {
          setDatos(fetchdatos);
          
          if (fetchdatos.abilities) {
            await cargarHabilidades(fetchdatos.abilities);
          }
          await cargarDescripcionSoloEspanol(numero);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  // Efecto para cambiar Pokémon cuando cambia el número
  useEffect(() => {
    if (numero >= 1 && appIsReady) {
      const cargarPokemon = async () => {
        const fetchdatos = await fetchConManejoErrores(`https://pokeapi.co/api/v2/pokemon/${numero}`);
        
        // Si no se encontró el Pokémon, retrocede
        if (!fetchdatos) {
          setNumero(prev => prev > 1 ? prev - 1 : 1);
          return;
        }
        
        setDatos(fetchdatos);
        
        if (fetchdatos.abilities) {
          await cargarHabilidades(fetchdatos.abilities);
        }
        await cargarDescripcionSoloEspanol(numero);
      };
      cargarPokemon();
    }
  }, [numero, appIsReady]);

  const getFontFamily = () => {
    if (fontLoaded) {
      return 'Pokemon-Classic';
    }
    
    if (Platform.OS === 'ios') {
      return 'Courier';
    } else if (Platform.OS === 'android') {
      return 'monospace'; 
    }
    
    return 'System';
  };

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Cargando Pokémon...</Text>
          <ActivityIndicator size="large" color="#FFF" style={styles.loadingIndicator} />
          <Text style={styles.loadingSubText}>Preparando tu aventura Pokémon</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!datos) {
    return (
      <View style={styles.container}>
        <Text style={{ fontFamily: getFontFamily(), fontSize: 20 }}>Cargando Pokémon...</Text>
      </View>
    );
  }

  const primerTipo = datos?.types?.[0]?.type?.name || 'normal';
  const segundoTipo = datos?.types?.[1]?.type?.name || 'normal';

  const obtenerColorTipo = (tipo) => {
    const colores = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      grass: '#78C850',
      electric: '#F8D030',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dark: '#705848',
      dragon: '#7038F8',
      steel: '#B8B8D0',
      fairy: '#EE99AC'
    };
    return colores[tipo] || '#68A090'; 
  };

  const obtenerColorHabilidad = (oculta) => {
    return oculta ? obtenerColorTipo(segundoTipo) : obtenerColorTipo(primerTipo) ||'A8A878' ;
  };

  const traduccionDeTipos = (tipo) => {
    switch(tipo){
      case 'fire':
        return 'Fuego🔥';
      case 'water':
        return 'Agua🌊';
      case 'normal':
        return 'Normal🐾';
      case 'dark':
        return 'Siniestro🌙';
      case 'fairy':
        return 'Hada✨';
      case 'ghost':
        return 'Fantasma👻';
      case 'rock':
        return 'Roca⛏️';
      case 'bug':
        return 'Bicho🕷️';
      case 'flying':
        return 'Volador🦅';
      case 'electric':
        return 'Electrico⚡';
      case 'ice':
        return 'Hielo❄️';
      case 'poison':
        return 'Veneno💀';
      case 'steel':
        return 'Acero⚙️';
      case 'fighting':
        return 'Lucha👊';
      case 'dragon':
        return 'Dragon🐉';
      case 'psychic':
        return 'Psiquico🔮';
      case 'grass':
        return 'Planta🌿';
      case 'ground':
        return 'Tierra⛰️';
      default:
        return tipo;
    }
  };

  const obtenerImagen = () => {
    if (generacion === 0) {
      if (esshiny) {
        return datos.sprites?.front_shiny || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
      } else {
        return datos.sprites?.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
      }
    }
    
    if (generacion === 9) {
      if (esshiny) {
        return datos.sprites?.other?.['official-artwork']?.front_shiny || 
               `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
      } else {
        return datos.sprites?.other?.['official-artwork']?.front_default || 
               `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
      }
    }
    
    if (generacion >= 1 && generacion <= 8) {
      switch(generacion) {
        case 1:
          if (esshiny) {
            return datos.sprites?.versions?.['generation-i']?.yellow?.front_shiny ||
                   datos.sprites?.front_shiny ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
          } else {
            return datos.sprites?.versions?.['generation-i']?.['red-blue']?.front_default ||
                   datos.sprites?.versions?.['generation-i']?.yellow?.front_default ||
                   datos.sprites?.front_default ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
          }
        case 2:
          if (esshiny) {
            return datos.sprites?.versions?.['generation-ii']?.crystal?.front_shiny ||
                   datos.sprites?.versions?.['generation-ii']?.gold?.front_shiny ||
                   datos.sprites?.front_shiny ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
          } else {
            return datos.sprites?.versions?.['generation-ii']?.crystal?.front_default ||
                   datos.sprites?.versions?.['generation-ii']?.gold?.front_default ||
                   datos.sprites?.versions?.['generation-ii']?.silver?.front_default ||
                   datos.sprites?.front_default ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
          }
        case 3:
          if (esshiny) {
            return datos.sprites?.versions?.['generation-iii']?.emerald?.front_shiny ||
                   datos.sprites?.versions?.['generation-iii']?.['ruby-sapphire']?.front_shiny ||
                   datos.sprites?.versions?.['generation-iii']?.['firered-leafgreen']?.front_shiny ||
                   datos.sprites?.front_shiny ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
          } else {
            return datos.sprites?.versions?.['generation-iii']?.emerald?.front_default ||
                   datos.sprites?.versions?.['generation-iii']?.['ruby-sapphire']?.front_default ||
                   datos.sprites?.versions?.['generation-iii']?.['firered-leafgreen']?.front_default ||
                   datos.sprites?.front_default ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
          }
        case 4:
          if (esshiny) {
            return datos.sprites?.versions?.['generation-iv']?.platinum?.front_shiny ||
                   datos.sprites?.versions?.['generation-iv']?.['diamond-pearl']?.front_shiny ||
                   datos.sprites?.versions?.['generation-iv']?.['heartgold-soulsilver']?.front_shiny ||
                   datos.sprites?.front_shiny ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
          } else {
            return datos.sprites?.versions?.['generation-iv']?.platinum?.front_default ||
                   datos.sprites?.versions?.['generation-iv']?.['diamond-pearl']?.front_default ||
                   datos.sprites?.versions?.['generation-iv']?.['heartgold-soulsilver']?.front_default ||
                   datos.sprites?.front_default ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
          }
        case 5:
          if (esshiny) {
            return datos.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_shiny ||
                   datos.sprites?.front_shiny ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
          } else {
            return  datos.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default ||
                   datos.sprites?.front_default ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
          }
        case 6:
          if (esshiny) {
            return datos.sprites?.versions?.['generation-vi']?.['x-y']?.front_shiny ||
                   datos.sprites?.versions?.['generation-vi']?.['omegaruby-alphasapphire']?.front_shiny ||
                   datos.sprites?.front_shiny ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
          } else {
            return datos.sprites?.versions?.['generation-vi']?.['x-y']?.front_default ||
                   datos.sprites?.versions?.['generation-vi']?.['omegaruby-alphasapphire']?.front_default ||
                   datos.sprites?.front_default ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
          }
        case 7:
          if (esshiny) {
            return datos.sprites?.versions?.['generation-vii']?.['ultra-sun-ultra-moon']?.front_shiny ||
                   datos.sprites?.versions?.['generation-vii']?.icons?.front_shiny ||
                   datos.sprites?.front_shiny ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
          } else {
            return datos.sprites?.versions?.['generation-vii']?.['ultra-sun-ultra-moon']?.front_default ||
                   datos.sprites?.versions?.['generation-vii']?.icons?.front_default ||
                   datos.sprites?.front_default ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
          }
        case 8:
          if (esshiny) {
            return datos.sprites?.versions?.['generation-viii']?.icons?.front_shiny ||
                   datos.sprites?.front_shiny ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
          } else {
            return datos.sprites?.versions?.['generation-viii']?.icons?.front_default ||
                   datos.sprites?.front_default ||
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
          }
        default:
          break;
      }
    }
    
    if (esshiny) {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`;
    } else {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
    }
  };
  
  const currentFontFamily = getFontFamily();

  const obtenerColorBorde = () => {
    return esshiny ? '#FFD700' : obtenerColorTipo(primerTipo);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={[obtenerColorTipo(primerTipo), obtenerColorTipo(segundoTipo) || '#2C2C2C']} 
        style={styles.container}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}    
      >
        <StatusBar style='light' />
        
        {/* FLECHAS INDICADORAS */}
        {/* Flecha izquierda (retroceder) */}
        <Animated.View 
          style={[
            styles.arrowContainer,
            styles.leftArrowContainer,
            { opacity: leftArrowOpacity }
          ]}
        >
          <Text style={styles.arrowIcon}>👈</Text>
          <Text style={[styles.arrowText, { fontFamily: currentFontFamily }]}>
            Retroceder
          </Text>
          <Text style={[styles.arrowSubText, { fontFamily: currentFontFamily }]}>
            Pokémon anterior
          </Text>
        </Animated.View>
        
        {/* Flecha derecha (avanzar) */}
        <Animated.View 
          style={[
            styles.arrowContainer,
            styles.rightArrowContainer,
            { opacity: rightArrowOpacity }
          ]}
        >
          <Text style={styles.arrowIcon}>👉</Text>
          <Text style={[styles.arrowText, { fontFamily: currentFontFamily }]}>
            Avanzar
          </Text>
          <Text style={[styles.arrowSubText, { fontFamily: currentFontFamily }]}>
            Pokémon siguiente
          </Text>
        </Animated.View>
        
        {/* Flecha abajo (aleatorio) */}
        <Animated.View 
          style={[
            styles.arrowContainer,
            styles.downArrowContainer,
            { opacity: downArrowOpacity }
          ]}
        >
          <Text style={styles.arrowIcon}>🎲</Text>
          <Text style={[styles.arrowText, { fontFamily: currentFontFamily }]}>
            Aleatorio
          </Text>
          <Text style={[styles.arrowSubText, { fontFamily: currentFontFamily }]}>
            Pokémon random
          </Text>
        </Animated.View>
        
        {/* SEARCH CONTAINER */}
        <View style={styles.searchWrapper}>
          <Animated.View style={[styles.inputContainer, {width: inputWidth, opacity: inputOpacity}]} >
            <TextInput
              style={[styles.input, {fontFamily: currentFontFamily}]}
              placeholder='Buscar Pokemon (ej: 25, pikachu, charizard-mega-x)'
              value={Buscarpokemon}
              onChangeText={setBuscarPokemon}
              autoFocus={IsSearchOpen}
              placeholderTextColor='#888'
              onSubmitEditing={() => {
                if (Buscarpokemon.trim() !== '') {
                  fetchNewPokemon(Buscarpokemon);
                }
              }}
            />
            <TouchableOpacity onPress={closeSearch} style={styles.closeButton}>
              <Text style={{ fontSize: 20, color: '#333' }}>✖</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{opacity: botonOpaco}}>
            <TouchableOpacity onPress={openSearch} style={[styles.searchButton, {borderColor: esshiny? '#FFD700': '#ddd'}]}>
              <Text style={{ fontSize: 20, color: IsSearchOpen ? "#ccc" : "#333" }}>🔍</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* CARD DE POKEMON CON MOVIMIENTO */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[
            styles.card, 
            { 
              borderColor: obtenerColorBorde(),
              borderWidth: 3, 
              shadowColor: obtenerColorBorde(),
              transform: [
                { translateX: cardTranslateX },
                { translateY: cardTranslateY },
                { scale: cardScale }
              ],
            }
          ]}>
            {/* IMAGEN CON TAP GESTURE */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={onImageTap}
              style={styles.imageTouchable}
            >
              <Animated.View style={{ transform: [{ scale: imageScale }] }}>
                <View style={styles.container_image}>
                  <Image 
                    style={styles.image} 
                    source={{ uri: obtenerImagen() }}
                    resizeMode="contain"
                    onError={(e) => console.log('Error cargando imagen:', e.nativeEvent.error)}
                  />
                  <View style={styles.generationIndicator}>
                    <Text style={[styles.generationText, { fontFamily: currentFontFamily }]}>
                      {generacion === 0 ? 'Default' : generacion === 9 ? 'Artwork' : `Gen ${generacion}`}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </TouchableOpacity>
            
            <Text style={[styles.name, { fontFamily: currentFontFamily }]}>
              {datos?.name ? datos.name.charAt(0).toUpperCase() + datos.name.slice(1).replace(/-/g, ' ') : 'Cargando...'}
            </Text>
            
            <View>
              <Text style={{textAlign: 'center', fontSize: 24 , fontFamily: currentFontFamily }}>
                ID: #{datos.id}
              </Text>
            </View>
            
            <View style={styles.tiposContainer}>
              {datos?.types?.map((tipoInfo, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tipoPill,
                    { backgroundColor: obtenerColorTipo(tipoInfo.type.name) }
                  ]}
                >
                  <Text style={[styles.tipoTexto, { fontFamily: currentFontFamily }]}>
                    {traduccionDeTipos(tipoInfo.type.name)}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.habilidadesContainer}>
              <Text style={[styles.habilidadesTitulo, { fontFamily: currentFontFamily }]}>
                Habilidades
              </Text>
              <View style={styles.habilidadesLista}>
                {habilidades.map((habilidad, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.habilidadPill,
                      { backgroundColor: obtenerColorHabilidad(habilidad.oculta) }
                    ]}
                  >
                    <Text style={[styles.habilidadTexto, { fontFamily: currentFontFamily }]}>
                      {habilidad.nombre} {habilidad.oculta ? ' (oculta)' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            
            {/* DESCRIPCIÓN CON TAP GESTURE */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={onDescripcionTap}
              style={styles.descripcionTouchable}
            >
              <Animated.View style={[styles.descripcionContainer, { transform: [{ scale: descripcionScale }] }]}>
                <Text style={[styles.descripcionTitulo, { fontFamily: currentFontFamily }]}>
                  Descripción 
                </Text>
                <View style={[
                  styles.descripcionCaja,
                  {
                    backgroundColor: `${obtenerColorTipo(primerTipo)}20`, 
                    borderWidth: 2, 
                    borderColor: obtenerColorTipo(primerTipo)
                  }
                ]}>
                  <Text style={[styles.descripcionTexto, { fontFamily: currentFontFamily }]}>
                    {descripcion || 'Cargando descripción...'}
                  </Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
            
            
          </Animated.View>
        </GestureDetector>
        
        {/* BOTÓN SHINY */}
        <TouchableOpacity 
          onPress={() => {
            setShiny(!esshiny)
          }} 
          style={[styles.botonShiny, {borderColor: esshiny? '#FFD700': '#ddd'}]}
          activeOpacity={0.7}
          disabled={cargando}
        >
          <Text style={styles.botonTexto}>{esshiny?'🌟' : '⭐'}</Text>
        </TouchableOpacity>
        
        {/* Indicador de carga */}
        {cargando && (
          <View style={styles.overlayCargando}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.textoCargando}>Cargando Pokémon...</Text>
          </View>
        )}
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loadingSubText: {
    fontSize: 16,
    color: 'white',
    marginTop: 20,
    opacity: 0.8,
  },
  loadingIndicator: {
    marginVertical: 10,
  },
  card: {
    width: 320,
    minHeight: 700,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 20, 
    elevation: 20, 
    borderRadius: 15,
    padding: 10,
  },
  container_image: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: 320,
    height: 200,
  },
  imageTouchable: {
    width: '100%',
  },
  generationIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  generationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  name: {
    textAlign: 'center',
    fontSize: 28,
    marginBottom: 10,
    marginTop: 10,
  },
  tiposContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 13,
    flexWrap: 'wrap',
    gap: 5,
  },
  tipoPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
  },
  tipoTexto: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
  },
  habilidadesContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  habilidadesTitulo: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
  habilidadesLista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  habilidadPill: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 5,
  },
  habilidadTexto: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
  },
  descripcionContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  descripcionTitulo: {
    fontSize: 18,
    marginBottom: 8,
    color: '#333',
  },
  descripcionCaja: {
    padding: 10,
    borderRadius: 10,
    width: '90%',
    minHeight: 80,
    justifyContent: 'center',
  },
  descripcionTexto: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    color: '#444',
  },
  descripcionTouchable: {
    width: '100%',
  },
  botonShiny: {
    position: 'absolute',
    right: 15,
    top: '12%',
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 9999,
    zIndex: 9999,
  },
  botonTexto: {
    fontSize: 24,
    textAlign: 'center',
  },
  gestureHint: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  gestureHintText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  searchWrapper: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    elevation: 99999, 
    zIndex: 99999, 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 99999,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 12,
    color: '#333',
  },
  closeButton: {
    padding: 1,
    marginLeft: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
  },
  searchButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 99999,
    top:-11,
    left:4
  },
  overlayCargando: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100000,
  },
  textoCargando: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  // Estilos para las flechas
  arrowContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 9999,
    zIndex: 9999,
  },
  leftArrowContainer: {
    left: 8,
    top: '50%',
    transform: [{ translateY: -50 }],
    borderColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.95)',
  },
  rightArrowContainer: {
    right: 8,
    top: '50%',
    transform: [{ translateY: -50 }],
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
  },
  downArrowContainer: {
    top: 100,
    alignSelf: 'center',
    borderColor: '#9C27B0',
    backgroundColor: 'rgba(156, 39, 176, 0.95)',
  },
  arrowIcon: {
    fontSize: 40,
    color: 'white',
    marginBottom: 5,
  },
  arrowText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  arrowSubText: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
  },
});