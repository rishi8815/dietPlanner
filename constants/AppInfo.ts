// App Information Content
// Privacy Policy, Terms of Service, and Help & Support

export const SUPPORT_EMAIL = 'rishabhgolhani2@gmail.com';

export const PRIVACY_POLICY = {
    title: 'Privacy Policy',
    lastUpdated: 'December 31, 2024',
    sections: [
        {
            heading: 'Introduction',
            content: 'Welcome to our app. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our mobile application.',
        },
        {
            heading: 'Information We Collect',
            content: 'We collect information you provide directly to us, including:\n\n• Personal information (name, email address)\n• Profile information (age, gender, height, weight)\n• Health and fitness goals\n• Dietary preferences and allergies\n• Usage data and app interactions',
        },
        {
            heading: 'How We Use Your Information',
            content: 'We use the information we collect to:\n\n• Provide personalized meal recommendations\n• Calculate your nutritional targets\n• Improve and optimize our services\n• Send you important updates about the app\n• Respond to your inquiries and support requests',
        },
        {
            heading: 'Data Storage and Security',
            content: 'Your data is stored securely using industry-standard encryption. We use Supabase for data storage, which provides enterprise-grade security features. We never sell your personal information to third parties.',
        },
        {
            heading: 'Your Rights',
            content: 'You have the right to:\n\n• Access your personal data\n• Correct inaccurate data\n• Delete your account and data\n• Export your data\n• Opt out of marketing communications',
        },
        {
            heading: 'Contact Us',
            content: `If you have any questions about this Privacy Policy, please contact us at ${SUPPORT_EMAIL}`,
        },
    ],
};

export const TERMS_OF_SERVICE = {
    title: 'Terms of Service',
    lastUpdated: 'December 31, 2024',
    sections: [
        {
            heading: 'Acceptance of Terms',
            content: 'By accessing or using our app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.',
        },
        {
            heading: 'Use of the App',
            content: 'You agree to use the app only for lawful purposes and in accordance with these terms. You must:\n\n• Provide accurate information when creating your account\n• Keep your login credentials secure\n• Not share your account with others\n• Not use the app for any illegal activities',
        },
        {
            heading: 'Health Disclaimer',
            content: 'The meal plans and nutritional information provided by this app are for general informational purposes only. They are not intended to be a substitute for professional medical advice, diagnosis, or treatment.\n\nAlways consult with a qualified healthcare provider before making changes to your diet, especially if you have any health conditions.',
        },
        {
            heading: 'Intellectual Property',
            content: 'All content in the app, including text, graphics, logos, and software, is the property of our company and is protected by intellectual property laws. You may not copy, modify, or distribute any content without our permission.',
        },
        {
            heading: 'Limitation of Liability',
            content: 'We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the app. Our total liability shall not exceed the amount you paid for the service.',
        },
        {
            heading: 'Changes to Terms',
            content: 'We may update these terms from time to time. We will notify you of any significant changes through the app or by email. Your continued use of the app after changes constitutes acceptance of the new terms.',
        },
        {
            heading: 'Contact',
            content: `For any questions regarding these Terms of Service, please contact us at ${SUPPORT_EMAIL}`,
        },
    ],
};

export const HELP_SUPPORT = {
    title: 'Help & Support',
    sections: [
        {
            heading: 'Getting Started',
            content: 'Welcome to our meal planning app! Here\'s how to get the most out of it:\n\n1. Complete your profile with accurate information\n2. Set your fitness goals\n3. Add your dietary preferences and allergies\n4. Explore personalized meal recommendations\n5. Track your daily nutrition intake',
        },
        {
            heading: 'Frequently Asked Questions',
            questions: [
                {
                    q: 'How are my calorie targets calculated?',
                    a: 'We use the Mifflin-St Jeor equation combined with your activity level and goals to calculate your personalized calorie targets.',
                },
                {
                    q: 'Can I change my dietary preferences?',
                    a: 'Yes! Go to your Profile and tap "Edit Profile" to update your dietary preferences, allergies, and other settings.',
                },
                {
                    q: 'How do I delete my account?',
                    a: 'Contact our support team at the email below, and we\'ll help you delete your account and all associated data.',
                },
                {
                    q: 'Is my data secure?',
                    a: 'Yes! We use industry-standard encryption and secure cloud storage to protect your personal information.',
                },
            ],
        },
        {
            heading: 'Contact Support',
            content: `Need more help? We're here for you!\n\n📧 Email: ${SUPPORT_EMAIL}\n\nWe typically respond within 24-48 hours. Please include your account email and a detailed description of your issue.`,
        },
        {
            heading: 'Report a Bug',
            content: `Found something not working correctly? Please email us at ${SUPPORT_EMAIL} with:\n\n• Your device model and OS version\n• Steps to reproduce the issue\n• Screenshots if available\n\nWe appreciate your help in making the app better!`,
        },
    ],
};
