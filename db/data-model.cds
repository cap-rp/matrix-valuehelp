namespace db;


entity CriticalityCells {
  key ID    : String(3); // e.g. "1A"
      Color : String; // white|green|orange|red
      Title : String;
}

entity ActionItems  {
  key ID          : String(3);
      title       : localized String(111);
      descr       : localized String(1111);
      criticality : String;
}
