import { Html } from '@react-email/html'
import { Head } from '@react-email/head'
import { Body } from '@react-email/body'
import { Container } from '@react-email/container'
import { Text } from '@react-email/text'

export default function BirthdayEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ backgroundColor: '#003087', padding: '20px', textAlign: 'center' }}>
          <Text style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold' }}>University of Professional Studies, Accra</Text>
          <Text style={{ color: '#FFD700', fontSize: '18px', fontWeight: 'bold' }}>Happy Birthday!</Text>
        </Container>
        <Container style={{ backgroundColor: '#FFFFFF', padding: '20px' }}>
          <Text style={{ fontSize: '16px' }}>Dear {name},</Text>
          <Text style={{ fontSize: '16px' }}>Happy Birthday from the University of Professional Studies, Accra management! We hope you have a wonderful day filled with joy and celebration.</Text>
          <Text style={{ fontSize: '16px' }}>🎂</Text>
        </Container>
        <Container style={{ backgroundColor: '#003087', padding: '10px', textAlign: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: '14px' }}>University of Professional Studies, Accra</Text>
          <div style={{ borderTop: '1px solid #FFD700', margin: '10px 0' }}></div>
        </Container>
      </Body>
    </Html>
  )
}
