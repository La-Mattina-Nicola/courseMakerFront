import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import { SectionList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


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

type SectionData =
    | { type: 'type'; item: TypeIngredientDB }
    | { type: 'ingredient'; item: IngredientDB }
    | { type: 'recette'; item: RecetteDB };

function Ingredients() {
    const [sections, setSections] = useState<{ title: string; data: SectionData[] }[]>([]);

    const fetchAll = async () => {
        const getHeaders = (): HeadersInit => ({
            "Content-Type": "application/json",
            Authorization: `${token}`,
        });

        const [typeRes, ingRes, recRes] = await Promise.all([
            fetch(`${api}typeingredients/`, { headers: getHeaders() }),
            fetch(`${api}ingredients/`, { headers: getHeaders() }),
            fetch(`${api}recettes/`, { headers: getHeaders() }),
        ]);

        const typeJson = await typeRes.json();
        const ingJson = await ingRes.json();
        const recJson = await recRes.json();

        setSections([
            {
                title: "Type ingredient",
                data: typeJson.results.map((item: TypeIngredientDB) => ({ type: 'type', item })),
            },
            {
                title: "Ingredient",
                data: ingJson.results.map((item: IngredientDB) => ({ type: 'ingredient', item })),
            },
            {
                title: "Recette",
                data: recJson.results.map((item: RecetteDB) => ({ type: 'recette', item })),
            },
        ]);
    };

    useFocusEffect(() => {
        fetchAll();
    });

    const renderItem = ({ item }: { item: SectionData }) => {
        switch (item.type) {
            case 'type':
                return (
                    <ThemedView>
                        <ThemedText>{item.item.id} {item.item.name}</ThemedText>
                    </ThemedView>
                );
            case 'ingredient':
                return (
                    <ThemedView>
                        <ThemedText>{item.item.id} {item.item.name} // {item.item.type.name}</ThemedText>
                    </ThemedView>
                );
            case 'recette':
                return (
                    <ThemedView>
                        <ThemedText style={styles.subTitle}>{item.item.id} — {item.item.name}</ThemedText>
                        {item.item.ingredients.map((ing) => (
                            <ThemedText key={ing.id}>• {ing.name} ({ing.type.name})</ThemedText>
                        ))}
                    </ThemedView>
                );
        }
    };

    return (
        <SafeAreaView style={styles.sheet}>
            <SectionList
                sections={sections}
                keyExtractor={(item, index) => `${item.type}-${item.item.id}-${index}`}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <ThemedText style={styles.title}>{title} :</ThemedText>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    sheet: {
        margin: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        paddingVertical: 4,
    },
    subTitle: {
        fontSize: 18,
    },
});

export default Ingredients;
