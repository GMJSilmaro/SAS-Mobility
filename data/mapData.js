import { images } from "../constants";

export const markers = [
  {
    id: "1",
    coordinate: {
      latitude: 22.6293867,
      longitude: 88.4354486,
    },
    name: "Music Fest Extravaganza",
    description: "Experience an electrifying fusion of genres and artists",
    type: "Music Festival",
    image: images.event1,
    rating: 4.5,
    reviews: 120,
    address: "123 Main Street",
    phoneNumber: "+1 (555) 123-4567",
    distance: 1.5,
    facilities: ["Multiple Stages", "Food Vendors", "VIP Lounges"],
    price: "$50 - $200",
    website: "www.musicfestextravaganza.com"
  },
  {
    id: "2",
    coordinate: {
      latitude: 22.6345648,
      longitude: 88.4377279,
    },
    name: "Art Gallery Showcase",
    description: "Immerse yourself in a collection of visionary artworks",
    type: "Art Exhibition",
    image: images.event2,
    rating: 4.2,
    reviews: 90,
    address: "456 Elm Street",
    phoneNumber: "+1 (555) 987-6543",
    distance: 3,
    facilities: ["Gallery Spaces", "Interactive Installations", "Artisan Stalls"],
    price: "Free Admission",
    website: "www.artgalleryshowcase.com"
  },
  {
    id: "3",
    coordinate: {
      latitude: 22.6281662,
      longitude: 88.4410113,
    },
    name: "Tech Conference Innovate",
    description: "Explore the latest trends and innovations in technology",
    type: "Tech Conference",
    image: images.event3,
    rating: 4.8,
    reviews: 150,
    address: "789 Oak Lane",
    phoneNumber: "+1 (555) 321-7890",
    distance: 2.5,
    facilities: ["Keynote Speakers", "Workshop Sessions", "Networking Events"],
    price: "$100 - $500",
    website: "www.techconferenceinnovate.com"
  },
  {
    id: "4",
    coordinate: {
      latitude: 22.6341137,
      longitude: 88.4497463,
    },
    name: "Food Festival Feast",
    description: "Savor a culinary journey with gourmet delights from around the world",
    type: "Food Festival",
    image: images.event4,
    rating: 4.9,
    reviews: 120,
    address: "101 Oak Street",
    phoneNumber: "+1 (555) 321-7890",
    distance: 2,
    facilities: ["Food Stalls", "Live Cooking Demos", "Tasting Events"],
    price: "$20 - $100",
    website: "www.foodfestivalfeast.com"
  },
  {
    id: "5",
    coordinate: {
      latitude: 22.5341137,
      longitude: 88.4797463,
    },
    name: "Cultural Carnival Celebration",
    description: "Celebrate diversity with a colorful array of cultural performances",
    type: "Cultural Event",
    image: images.event5,
    rating: 4.7,
    reviews: 110,
    address: "101 Oak Street",
    phoneNumber: "+1 (555) 321-7890",
    distance: 2,
    facilities: ["Live Performances", "Artisan Markets", "Traditional Cuisine"],
    price: "$10 - $50",
    website: "www.culturalcarnivalcelebration.com"
  }
];


export const mapDarkStyle = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#212121"
        }
      ]
    },
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#212121"
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#bdbdbd"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#181818"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#1b1b1b"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#2c2c2c"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#8a8a8a"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#373737"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3c3c3c"
        }
      ]
    },
    {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#4e4e4e"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "featureType": "transit",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#000000"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#3d3d3d"
        }
      ]
    }
  ];

export const mapStandardStyle = [
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
];