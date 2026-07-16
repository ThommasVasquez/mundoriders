const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando siembra de pilotos de ejemplo en Colombia...")

  const ridersData = [
    {
      username: "@mateo_adventurer",
      email: "mateo@rider.com",
      nombre: "Mateo Gómez",
      fotoPerfil: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=400&auto=format&fit=crop&q=80",
      fotoPortada: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
      bio: "Amante del touring y las trochas colombianas. Viajando por Colombia en mi BMW GS 1250. 🏔️🇨🇴",
      ciudad: "Medellín",
      nivelExperiencia: "EXPERTO",
      tipoRider: "TOURING",
      motos: {
        create: [
          {
            marca: "BMW",
            modelo: "R 1250 GS",
            cilindraje: 1250,
            anio: 2023,
            apodo: "La Consentida",
            fotoUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80",
          }
        ]
      },
      posts: {
        create: [
          {
            contenido: "Alistando maletas para subir el Alto de Letras este fin de semana. ¿Quién se le mide a salir temprano desde Mariquita? La carretera está en excelente estado.",
            mediaUrls: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80"]
          },
          {
            contenido: "Qué belleza de paisajes en el Eje Cafetero. El tramo entre Salento y Filandia está perfecto para rodar despacio y disfrutar del aroma a café.",
            mediaUrls: []
          }
        ]
      }
    },
    {
      username: "@tatiana_sport",
      email: "tatiana@rider.com",
      nombre: "Tatiana Ortiz",
      fotoPerfil: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80",
      fotoPortada: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&auto=format&fit=crop&q=80",
      bio: "Curvas y adrenalina. Buscando siempre la trazada perfecta. Yamaha R6 de pista y calle. ⚡🏍️",
      ciudad: "Bogotá",
      nivelExperiencia: "AVANZADO",
      tipoRider: "SPORT",
      motos: {
        create: [
          {
            marca: "Yamaha",
            modelo: "YZF-R6",
            cilindraje: 600,
            anio: 2022,
            apodo: "La Avispa",
            fotoUrl: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600&auto=format&fit=crop&q=80",
          }
        ]
      },
      posts: {
        create: [
          {
            contenido: "Día de pista en el Autódromo de Tocancipá. Bajando tiempos y sintiendo el agarre perfecto de las llantas en las curvas rápidas.",
            mediaUrls: ["https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80"]
          },
          {
            contenido: "Rodada nocturna por el norte de Bogotá hacia Guatavita. El frío de la Sabana se pasa mejor curveando en grupo.",
            mediaUrls: []
          }
        ]
      }
    },
    {
      username: "@carlos_custom",
      email: "carlos@rider.com",
      nombre: "Carlos Restrepo",
      fotoPerfil: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      fotoPortada: "https://images.unsplash.com/photo-1471440671318-55dddde1a56c?w=1200&auto=format&fit=crop&q=80",
      bio: "Rutas lentas, vientos largos. La vida se aprecia mejor a 80 km/h en mi Harley Davidson. 🇺🇸💀",
      ciudad: "Cali",
      nivelExperiencia: "AVANZADO",
      tipoRider: "CUSTOM",
      motos: {
        create: [
          {
            marca: "Harley-Davidson",
            modelo: "Iron 883",
            cilindraje: 883,
            anio: 2021,
            apodo: "La Bestia",
            fotoUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
          }
        ]
      },
      posts: {
        create: [
          {
            contenido: "Recorriendo la Ruta del Sol con los parceros del club custom. El rugido de los motores bicilíndricos en V es música para el alma.",
            mediaUrls: ["https://images.unsplash.com/photo-1471440671318-55dddde1a56c?w=600&auto=format&fit=crop&q=80"]
          },
          {
            contenido: "Una rodada relajada de domingo por el Valle del Cauca. Parada obligatoria en el Kilómetro 18 para comer chocolate con queso caliente.",
            mediaUrls: []
          }
        ]
      }
    },
    {
      username: "@santiago_urbano",
      email: "santiago@rider.com",
      nombre: "Santiago Velez",
      fotoPerfil: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
      fotoPortada: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
      bio: "Esquivando el tráfico de la ciudad de lunes a viernes y buscando curvas el fin de semana. KTM Duke. 🏙️🔥",
      ciudad: "Barranquilla",
      nivelExperiencia: "INTERMEDIO",
      tipoRider: "URBANO",
      motos: {
        create: [
          {
            marca: "KTM",
            modelo: "Duke 390",
            cilindraje: 373,
            anio: 2023,
            apodo: "El Juguete",
            fotoUrl: "https://images.unsplash.com/photo-1622185135505-2d795003994a?w=600&auto=format&fit=crop&q=80",
          }
        ]
      },
      posts: {
        create: [
          {
            contenido: "Esquivando trancones todos los días en el caos de la ciudad. Las naked son lo mejor para la agilidad en la selva de cemento.",
            mediaUrls: []
          },
          {
            contenido: "Rodada express de domingo por la Vía al Mar hasta Cartagena. Desayuno en puerto y de regreso antes de que caliente el sol.",
            mediaUrls: ["https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80"]
          }
        ]
      }
    }
  ]

  for (const rider of ridersData) {
    // Delete if existing
    const existing = await prisma.user.findUnique({
      where: { username: rider.username }
    })

    if (existing) {
      console.log(`Eliminando piloto existente: ${rider.username}`)
      await prisma.user.delete({
        where: { id: existing.id }
      })
    }

    // Create new
    const created = await prisma.user.create({
      data: rider,
      include: {
        motos: true,
        posts: true
      }
    })
    console.log(`Piloto creado con éxito: ${created.nombre} (${created.username}) con ${created.motos.length} moto(s) y ${created.posts.length} publicación(es).`)
  }

  console.log("¡Siembra de pilotos de ejemplo completada con éxito!")
}

main()
  .catch((e) => {
    console.error("Error al sembrar pilotos:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
