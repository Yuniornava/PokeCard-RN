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
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [datos, setDatos] = useState(null);
  const [numero, setNumero] = useState(1);
  const [esshiny, setShiny] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);
  const [habilidades, setHabilidades] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [IsSearchOpen, setIsSearchOpen] = useState(false)
  const [Buscarpokemon, setBuscarPokemon] = useState('')

  // Función para buscar pokemon
  const fetchNewPokemon = async (pokemon) => {
    try {
      const id = isNaN(pokemon) ? pokemon.toLowerCase().trim() : parseInt(pokemon);
      const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      
      if (!respuesta.ok) {
        throw new Error('Pokémon no encontrado');
      }
      
      const fetchdatos = await respuesta.json();
      setDatos(fetchdatos);
      setNumero(fetchdatos.id);
      
      if (fetchdatos.abilities) {
        await cargarHabilidades(fetchdatos.abilities);
      }

      await cargarDescripcion(fetchdatos.id);
      
      closeSearch();
    } catch(error) {
      console.log("Error buscando pokemon:", error);
      alert('Pokémon no encontrado. Intenta con un ID válido (1-1025) o nombre en inglés.');
    }
  };

  // Animaciones con animated
  const inputWidth = useRef(new Animated.Value(0)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const botonOpaco = useRef(new Animated.Value(1)).current;

  const screenWidth = Dimensions.get('window').width;
  const maxInputWidth = screenWidth * 0.7;

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
        const res = await fetch(ability.ability.url);
        const data = await res.json();
        
        const nombreEs = data.names?.find(n => n.language.name === 'es');
        
        habilidadesTraducidas.push({
          nombre: nombreEs ? nombreEs.name : ability.ability.name.replace('-', ' '),
          oculta: ability.is_hidden
        });
      } catch (error) {
        habilidadesTraducidas.push({
          nombre: ability.ability.name.replace('-', ' '),
          oculta: ability.is_hidden
        });
      }
    }
    
    setHabilidades(habilidadesTraducidas);
  };

  // Función para cargar la descripción
  const cargarDescripcion = async (pokemonId) => {
    try {
      const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
      const data = await respuesta.json();
      
      const entradaEspanol = data.flavor_text_entries?.find(
        entry => entry.language.name === 'es'
      );
      
      if (entradaEspanol) {
        setDescripcion(entradaEspanol.flavor_text.replace(/\n/g, ' '));
      } else {
        const entradaIngles = data.flavor_text_entries?.find(
          entry => entry.language.name === 'en'
        );
        
        if (entradaIngles) {
          setDescripcion(entradaIngles.flavor_text.replace(/\n/g, ' '));
        } else {
          setDescripcion('No hay descripción disponible.');
        }
      }
    } catch (error) {
      console.error('Error cargando descripción:', error);
      setDescripcion('');
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        await Font.loadAsync({
          'Pokemon-Classic': require('./assets/fonts/Pokemon-Classic.ttf'),
        });
        setFontLoaded(true);

        const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${numero}`);
        const fetchdatos = await respuesta.json();
        setDatos(fetchdatos);
        
        if (fetchdatos.abilities) {
          await cargarHabilidades(fetchdatos.abilities);
        }

        await cargarDescripcion(numero);

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
        try {
          const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${numero}`);
          const fetchdatos = await respuesta.json();
          setDatos(fetchdatos);
          
          if (fetchdatos.abilities) {
            await cargarHabilidades(fetchdatos.abilities);
          }

          await cargarDescripcion(numero);
        } catch(error) {
          console.log("Error cargando pokemon:", error);
          setNumero(prev => prev - 1);
        }
      };
      cargarPokemon();
    }
  }, [numero, appIsReady, esshiny]);

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
    if (esshiny && datos.sprites?.front_shiny) {
      return datos.sprites.front_shiny;
    } else if (datos.sprites?.front_default) {
      return datos.sprites.front_default;
    }
    if (datos.sprites?.other?.['official-artwork']?.front_default) {
      return datos.sprites.other['official-artwork'].front_default;
    }
    
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`;
  };

  const currentFontFamily = getFontFamily();

  
  const obtenerColorBorde = () => {
    return esshiny ? '#FFD700' : obtenerColorTipo(primerTipo);
  };

  return (
    <LinearGradient
      colors={[obtenerColorTipo(primerTipo), obtenerColorTipo(segundoTipo) || '#2C2C2C']} 
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}    
    >
      <StatusBar style='light' />
      
      {/* SEARCH CONTAINER */}
      <View style={styles.searchWrapper}>
        <Animated.View style={[styles.inputContainer, {width: inputWidth, opacity: inputOpacity , }]} >
          <TextInput
            style={[styles.input, {fontFamily: currentFontFamily} ]}
            placeholder='Buscar Pokemon'
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
      
      {/* CARD DE POKEMON */}
      <View style={[
        styles.card, 
        { 
          borderColor: obtenerColorBorde(),
          borderWidth: 3, 
          shadowColor: obtenerColorBorde()
        }
      ]}>
        <View style={styles.container_image}>
          <Image 
            style={styles.image} 
            source={{ uri: obtenerImagen() }}
            resizeMode="contain"
            onError={(e) => console.log('Error cargando imagen:', e.nativeEvent.error)}
          />
        </View>
        
        <Text style={[styles.name, { fontFamily: currentFontFamily }]}>
          {datos?.name ? datos.name.charAt(0).toUpperCase() + datos.name.slice(1) : 'Cargando...'}
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
                  {habilidad.nombre} {habilidad.oculta ? '!' : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.descripcionContainer}>
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
        </View>
      </View>
      
 
      {/* BOTÓN IZQUIERDA: RETROCEDER */}
      <TouchableOpacity 
        onPress={() => setNumero(numero <= 1 ? 1 : numero - 1)} 
        style={[styles.botonRetroceder, {borderColor: esshiny? '#FFD700': '#ddd'}]}
        activeOpacity={0.7}
      >
        <Text style={styles.botonTexto}>⬅️</Text>
      </TouchableOpacity>
      
      {/* BOTÓN  SHINY */}
      <TouchableOpacity 
        onPress={() => {
          setShiny(!esshiny)
        }} 
        style={[styles.botonShiny, {borderColor: esshiny? '#FFD700': '#ddd'}]}
        activeOpacity={0.7}
      >
        <Text style={styles.botonTexto}>{esshiny?'🌟' : '⭐'}</Text>
      </TouchableOpacity>
      
      {/* BOTÓN DERECHA: AVANZAR */}
      <TouchableOpacity 
        onPress={() => setNumero(numero + 1)} 
        style={[styles.botonAvanzar, {borderColor: esshiny? '#FFD700': '#ddd'}]}
        activeOpacity={0.7}
      >
        <Text style={styles.botonTexto}>➡️</Text>
      </TouchableOpacity>
      
      {/* BOTÓN DERECHA: RANDOM */}
      <TouchableOpacity 
        onPress={() => {
          let nuevoNumero;
          do {
            nuevoNumero = Math.floor(Math.random() * 1025) + 1;
          } while (nuevoNumero === numero);
          
          setNumero(nuevoNumero);
        }} 
        style={[styles.botonRandom, {borderColor: esshiny? '#FFD700': '#ddd'}]}
        activeOpacity={0.7}
      >
        <Text style={styles.botonTextoRandom}>🎲</Text>
      </TouchableOpacity>
    </LinearGradient>
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
  },
  image: {
    width: 320,
    height: 200,
  },
  name: {
    textAlign: 'center',
    fontSize: 28,
    marginBottom: 10,
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
  // BOTONES INDIVIDUALES CON POSICIONES FIJAS
  botonAvanzar: {
    position: 'absolute',
    right: -2,
    top: '50%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 9999,
    zIndex: 9999,
    transform: [{ translateY: -30 }],
  },
  botonRetroceder: {
    position: 'absolute',
    left: -2,
    top: '50%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 9999,
    zIndex: 9999,
    transform: [{ translateY: -30 }],
  },
  botonShiny: {
    position: 'absolute',
    left: 15,
    top: 50,
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
  botonRandom: {
    position: 'absolute',
    right: 20,
    top: '8%',
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 9999,
    zIndex: 9999,
    transform: [{ translateY: 50 }], // 80px debajo del botón avanzar
  },
  botonTexto: {
    fontSize: 24,
    textAlign: 'center',
  },
  botonTextoRandom: {
    fontSize: 24,
    textAlign: 'center',
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
    marginLeft: 10,
  }
});