import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function App() {
  const [datos, Setdatos] = useState([]);
  const [numero, Setnumero] = useState(1);
  const [key, setKey] = useState(0)


  const FuncionFetch = async () => {
    try {
      const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${numero}`);
      const fetchdatos = await respuesta.json();
      Setdatos(fetchdatos);
      
    } catch(error) {
      console.log(error);
    }
  }
  
  useEffect(() => {
    FuncionFetch();
  }, [numero , key]);

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
  }

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
        return 'Volador 🦅';
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
        return 'psiquico🔮';
      case 'grass':
        return 'Planta🌿';
      case 'ground':
        return 'Tierra⛰️'
      default:
        return tipo;
    }
  }
  const obtenerImagen = () => {

  if (datos.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default) {
    return datos.sprites.versions['generation-v']['black-white'].animated.front_default;
  }
  
  
  if (datos.sprites?.front_default) {
    return datos.sprites.front_default;
  }
  
  if (datos.sprites?.other?.['official-artwork']?.front_default) {
    return datos.sprites.other['official-artwork'].front_default;
  }
  
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${numero}.png`;
}


  return (
    <LinearGradient
    colors={[obtenerColorTipo(primerTipo), obtenerColorTipo(segundoTipo)||'#2C2C2C']} 
    style={styles.container}
    start={{ x: 0.5, y: 0 }}
    end={{ x: 0.5, y: 1 }}    
  >
      <StatusBar  style='light'></StatusBar>
      <View style={[
  styles.card, 
  {borderColor: obtenerColorTipo(primerTipo), borderWidth: 3, shadowColor: obtenerColorTipo(primerTipo)}
]}>
        <View style={styles.container_image}>
          <Image 
          style={styles.image} 
          source={{uri: obtenerImagen()}}
        />
        </View>
        <Text style={styles.name}>
          {datos?.name ? datos.name.charAt(0).toUpperCase() + datos.name.slice(1) : 'Cargando...'}
        </Text>
        <View>
          <Text style={styles.name}>ID:#{datos.id}</Text>
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
              <Text style={styles.tipoTexto}>
                {traduccionDeTipos(tipoInfo.type.name)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      <TouchableOpacity onPress={() => Setnumero(numero + 1)} style={styles.boton_avanzar}>
        <Text style={styles.botonTexto}>➡️</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => Setnumero(numero <= 1 ? 1 : numero - 1)} style={styles.boton_retroceder}>
        <Text style={styles.botonTexto}>⬅️</Text>
      </TouchableOpacity>
       <TouchableOpacity 
    onPress={() => {
      let nuevoNumero;
      do {
        nuevoNumero = Math.floor(Math.random() * 1298) + 1;
      } while (nuevoNumero === numero);
      
      Setnumero(nuevoNumero);
      setKey(prev => prev + 1); 
    }} 
    style={styles.boton_random}
  >
    <Text style={styles.botonTextoRandom}>🎲</Text>
  </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6C7A8C',
    alignItems: 'center',
    justifyContent: 'center',
  },
card: {
  width: 320,
  height: 700,
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 15}, 
  shadowOpacity: 0.4, 
  shadowRadius: 20, 
  elevation: 25, 
  borderRadius: 15,

},
  container_image: {
    width: 300,
    height: 200,
    justifyContent: 'center',
    alignContent: 'center',
  },
  image: {
    width: 320,
    height: 200,
    resizeMode: 'contain',
  },
  name: {
    textAlign: 'center',
    fontSize: 30,
  },
  boton_avanzar: {
    position: 'absolute',
    right: -20,
    top: '42%',
    zIndex: 9999,
    elevation: 9999,
    width: 80,
    height: 80,
  },
  boton_retroceder: {
    position: 'absolute',
    left: -17,
    top: '42%',
    zIndex: 9999,
    elevation: 9999,
    width: 80,
    height: 80,
  },
boton_random: {
  position: 'absolute',
  right: 1,
    top: '5%',
  zIndex: 9999,
  elevation: 9999,
  width: 80,
  height: 80,
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 2},
  shadowOpacity: 0.3,
  shadowRadius: 3,
},
botonTextoRandom: {
  fontSize: 40,
  textAlign: 'center',
},
  botonTexto: {
    fontSize: 40,
    textAlign: 'center',
  },
  tiposContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  tipoPill: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginHorizontal: 5,
    marginVertical: 3,
  },
  tipoTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});