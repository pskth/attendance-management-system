'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Analytics Dashboard - Debug Version</CardTitle>
                        <CardDescription>Testing if basic page structure works</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>If you can see this, the basic page structure is working correctly.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
