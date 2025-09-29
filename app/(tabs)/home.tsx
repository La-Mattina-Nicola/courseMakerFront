import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet, Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const api = process.env.EXPO_PUBLIC_API
const token = process.env.EXPO_PUBLIC_TOKEN

type TypeIngredientDB = {
    id: number;
    name: string;
};

type IngredientDB = {
    id: number;
    name: string;
    type: TypeIngredientDB;
};
type RecetteDB = {
    id: number;
    name: string;
    ingredients: IngredientDB[];
};

type RecetteData = { item: RecetteDB };

function HomeScreen() {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [recettes, setRecettes] = useState<RecetteDB[]>([]);

    const filtered = recettes.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    const fetchData = async () => {
        setLoading(true);
        const getHeaders = (): HeadersInit => ({
            "Content-Type": "application/json",
            Authorization: `${token}`,
        });
        const response = await fetch(`${api}recettes/`, { headers: getHeaders() });
        const json = await response.json();
        setRecettes(json.results);
        setLoading(false);

    };

    useEffect(() => {
        fetchData();
    }, []);

    return (<>
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Recettes</Text>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#aaa" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher"
                    placeholderTextColor="#666"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="orange" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={1}
                    contentContainerStyle={styles.grid}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>{item.name}</Text>
                            <Text style={styles.cardSubtitle}>
                                {item.ingredients.length} ingrédients
                            </Text>
                        </View>
                    )}
                />
            )}

            <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        paddingHorizontal: 16,
        paddingTop: 40,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        color: '#fff',
    },
    grid: {
        gap: 1,
    },
    card: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        padding: 12,
        margin: 6,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#aaa',
        marginTop: 8,
    },
    addButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#aaa',
        borderRadius: 30,
        padding: 16,
        elevation: 5,
    },
});

export default HomeScreen;