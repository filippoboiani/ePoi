User // UserCustomer and UserBusiness

{
  _id: "",
  type: "customer" || "business",
  name: "",
  mail: "",
  lastname: "",
  history: [HistoryItem, HistoryItem, ... ],
  ownedPois: [poi_id, poi_id, poi_id]
}

HistoryItem

{
  customer_id: "",
  coordinates: {
    lat: "",
    lng: ""
  },
  mobility_type: "",
  pois: [poi_id, poi_id, poi_id, poi_id]
}


Poi

{
  "_id": "",
  "name": "Bar Otello",
  "activity": "walking",
  "message": "Inaugurazione, nuova gestione. ",
  "radius": "20",
  "sender": "business_id",
  "center": {
    "lat": "44.4935804",
    "lng": "11.3447025"
  },
  "interval": {
    "from": "",
    "to": ""
  }
}
