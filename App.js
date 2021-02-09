/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  View,
  Text,
  Button,
  StatusBar,
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PositionOverMap } from './situm_screen';
import SitumPlugin from 'react-native-situm-plugin';
import { SITUM_EMAIL, SITUM_API_KEY, SITUM_PASS } from './config';
import { Navigation } from "react-native-navigation";

export const App: () => React$Node = (props) => {
  const [buildings, setBuildings] = useState([])
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  const _onItemPress = (item) => {
    var component = {
      name: "PositionOverMap",
      component: PositionOverMap,
      options: {
        topBar: {
          title: {
            text: "Indoor-outdoor Positioning",
          },
        },
      },
      passProps: {
        building: {},
      },
    };
    component.passProps.building = item;

    Navigation.push(props.componentId, {
      component: component,
    });
  };

  const getBuildings = () => {
    SitumPlugin.fetchBuildings(
      (buildings) => {
        setBuildings(buildings);
        setIsLoading(false);
        if (!buildings || buildings.length == 0) {
          return (
            <Text>"No buildings, add a few buildings first by going to:\nhttps://dashboard.situm.es/buildings"</Text>
          );
        }
      },
      (error) => {
        console.log(error)
        setError(error);
        setIsLoading(false);
      }
    );
  };

  useEffect(() => {
    SitumPlugin.initSitumSDK();
    SitumPlugin.setApiKey(SITUM_EMAIL, SITUM_API_KEY, (response) => {
      console.log(JSON.stringify(response));
      console.log('Authenticated Succesfully: ' + response.success);
    });
    SitumPlugin.setCacheMaxAge(1, (response) => { // an hour
      console.log('Cache Age: ' + response.success);
    });

    Navigation.registerComponent('PositionOverMap', () => PositionOverMap)
    getBuildings();
  }, [props.componentId]);

  const _listEmptyComponent = () => {
    return (
      <View>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Header />
        </ScrollView>
      </SafeAreaView>
      <SafeAreaView style={styles.safeAreaView}>
        <FlatList
          data={buildings}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => _onItemPress(item)}>
              <Text style={styles.text}>{item.name}</Text>
              <View style={styles.divider} />
            </TouchableOpacity>
          )}
          refreshing={isLoading}
          onRefresh={() => getBuildings()}
          style={styles.buildingList}
          ListEmptyComponent={_listEmptyComponent}
          keyExtractor={(item, index) => index.toString()}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  safeAreaView: {
    flex: 1,
    justifyContent: "center",
  },
  buildingList: {
    flex: 1,
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "#eee",
  },
  text: {
    fontSize: 18,
    padding: 15,
  },
});

export default App;
