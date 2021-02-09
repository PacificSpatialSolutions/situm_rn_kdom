import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { StyleSheet } from 'react-native';
import MapView, { Overlay, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import SitumPlugin from 'react-native-situm-plugin';

let subscriptionId = -1;
export const PositionOverMap = (props) => {
  const [location, setLocation] = useState(null);
  const [building, setBuilding] = useState(props.building);
  const [mapImage, setMapImage] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [poiAndIconArray, setPoiAndIconArray] = useState([]);
  const [center, setCenter] = useState({
    latitude: 0.0,
    longitude: 0.0,
  });
  const [rotation, setRotation] = useState(0.0);
  const [isLoading, setIsLoading] = useState(false);
  let poiIconsArray = [];

  const locationOptions = {
    useWifi: true,
    useBle: true,
    useForegroundService: true,
    useGlobalLocation: true,
    realtimeUpdateInterval: "5000", // Possible values: 5000, 15000, 250000 (NOTE: values are in milliseconds)
    outdoorLocationOptions: {
      buildingDetector: "kSITBLE", // options: kSITBLE, kSITGpsProximity; default:
      // minimumOutdoorLocationAccuracy: 10
      averageSnrThreshold: 40
    }
  };

  const getFloorsFromBuilding = () => {
    setIsLoading(true);
    SitumPlugin.fetchFloorsFromBuilding(
      building,
      (floors) => {
        setIsLoading(false);

        if (floors.length > 0) {
          setCenter({
            latitude: building.center.latitude,
            longitude: building.center.longitude,
          });

          setBounds([
            [
              building.bounds.northEast.latitude,
              building.bounds.southWest.longitude,
            ],
            [
              building.bounds.southWest.latitude,
              building.bounds.northEast.longitude,
            ],
          ]);

          setMapImage(floors[0].mapUrl);
          getPOIsFromBuilding();
          console.log(building.rotation)
          setRotation(building.rotation * 180 / Math.PI);
          console.log(center);
        } else {
          console.log("No floors found!");
        }
      },
      (error) => {
        console.log(error);
        setIsLoading(false);
      }
    );
  };

  const getPOIsFromBuilding = () => {
    setIsLoading(true);
    SitumPlugin.fetchIndoorPOIsFromBuilding(
      building,
      (pois) => {
        setIsLoading(false);
        setPoiAndIconArray([]);
        for (let poi of pois) {
          getIconForPOI(poi);
        }
      },
      (error) => {
        console.log(error);
        setIsLoading(false);
      }
    );
  };

  const getIconForPOI = (poi) => {
    SitumPlugin.fetchPoiCategoryIconNormal(poi.category, (icon) => {
      poiIconsArray = [
        ...poiIconsArray,
        { poi: poi, icon: "data:image/png;base64," + icon.data },
      ];

      setPoiAndIconArray(poiIconsArray);
    });
  };

  const startPositioning = () => {
    // if (Platform.OS === "ios") return;

    console.log("start positioning..")
    setIsLoading(true);
    subscriptionId = SitumPlugin.startPositioning(
      (location) => {
        console.log(location.buildingIdentifier);
        setIsLoading(false);
        setLocation(location);
        // setMapRegion({
        //   latitude: location.coordinate.latitude,
        //   longitude: location.coordinate.longitude,
        //   latitudeDelta: 0.002,
        //   longitudeDelta: 0.002,
        // });
      },
      (status) => {
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        console.log("error !!!")
        console.log(error);
        stopPositioning();
      },
      locationOptions
    );
  };

  const stopPositioning = () => {
    // if (Platform.OS === "ios") return;

    SitumPlugin.stopPositioning(subscriptionId, (success) => {
      console.log(success);
    });
  };

  useEffect(() => {
    getFloorsFromBuilding();
    return () => {
      stopPositioning();
    };
  }, [building]);

  useEffect(() => {
    console.log(mapImage);
    startPositioning();
    return () => {
      stopPositioning();
    };
  }, [mapImage]);

  return (
    <View style={styles.container}>
      <MapView
        style={{ width: "100%", height: "100%" }}
        // region={mapRegion}
        camera={{
          center: {
            latitude: center.latitude,
            longitude: center.longitude
          },
          pitch: 0.0,
          heading: rotation,
          altitude: 20,
          zoom: 19
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        rotateEnabled={true}
        provider={PROVIDER_GOOGLE}
      >
        {location != undefined && (
          <Marker
            rotation={location.bearing.degrees}
            coordinate={location.coordinate}
            image={require("./ic_direction.png")}
          />
        )}
        {mapImage != undefined && (
          <Overlay
            image={mapImage}
            bounds={bounds}
            zIndex={1000}
            location={[center.latitude, center.longitude]}
            bearing={building.rotation * 180 / Math.PI}
            anchor={[0.5, 0.5]}
            width={building.dimensions.width}
            height={building.dimensions.height}
          />
        )}
        {poiAndIconArray[0] != null &&
          poiAndIconArray.map((poiAndIcon) => (
            <Marker
              key={poiAndIcon.poi.identifier}
              coordinate={poiAndIcon.poi.coordinate}
              title={poiAndIcon.poi.poiName}
            >
              <Image
                source={{ uri: poiAndIcon.icon }}
                style={{ width: 40, height: 40 }}
              />
            </Marker>
          ))}
      </MapView>

      {isLoading && (
        <View style={{ position: 'absolute' }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: "row",
    paddingLeft: 10,
    marginTop: 10,
    alignItems: "center",
  },
});
