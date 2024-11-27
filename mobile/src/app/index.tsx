import { useState } from 'react';
import { View, Text, Image, Keyboard, Alert } from 'react-native';
import { MapPin, Settings2, UserRoundPlus, ArrowRight, AtSign,
Calendar as CalendarIcon} from 'lucide-react-native';
import { DateData } from 'react-native-calendars';
import dayjs from 'dayjs';
import { colors } from '@/styles/colors';
import { calendarUtils, DatesSelected } from '@/utils/calendarUtils';
import { Input } from '@/components/input';
import { Button } from '@/components/button';
import { Calendar } from '@/components/calendar';
import { Modal } from '@/components/modal';
import { GuestEmail } from '@/components/email';
import { validateInput } from '@/utils/validateInput';
import { tripStorage } from '@/storage/trip';
import { RelativePathString, router } from 'expo-router';
import { tripServer } from '@/server/trip-server';


enum StepForm {
    TRIP_DETAILS = 1,
    ADD_EMAIL = 2,
}
enum MODAL {
    NONE = 0,
    CALENDAR = 1,
    GUESTS = 2,
}

export default function Index() {
    // LOADING
    const [isCreatingTrip, setIsCreatingTrip] = useState(false);
    // DATA
    const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS);
    const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
    const [destination, setDestination] = useState('');
    const [showmodal, setshowModal] = useState(MODAL.NONE);
    const [emailToInvite, setEmailToInvite] = useState('');
    const [emailsToInvite, setEmailsToInvite] = useState<string[]>([]);

    function handleNextStepForm() {
        if (
            destination.trim().length === 0 ||
            !selectedDates.startsAt ||
            !selectedDates.endsAt
        ) {
            return Alert.alert(
                'Detalhes da viagem',
                'Preencha todas as informações para prosseguir.',
            );
        }
        if (destination.trim().length < 4) {
            return Alert.alert(
                'Detalhes da viagem',
                'Preencha pelo menos 4 letras para prosseguir.',
            );
        }

        if (stepForm === StepForm.TRIP_DETAILS) {
            return setStepForm(StepForm.ADD_EMAIL);
        }

        Alert.alert('Nova viagem', 'Confirmar viagem', [
            {
                text: 'Cancelar',
                style: 'cancel',
            },
            {
                text: 'Confirmar',
                onPress: createTrip,
            },
        ]);
    }

    function handleSelectDate(selectedDay: DateData) {
        const dates = calendarUtils.orderStartsAtAndEndsAt({
            startsAt: selectedDates.startsAt,
            endsAt: selectedDates.endsAt,
            selectedDay,
        });

        setSelectedDates(dates);
    }

    function handleRemoveEmail(emailToRemove: string) {
        setEmailsToInvite((prevState) =>
            prevState.filter((email) => email !== emailToRemove),
        );
    }

    function handleAddEmail() {
        if (!validateInput.email(emailToInvite)) {
            return Alert.alert(
                'Convidar amigos',
                'Insira um e-mail válido para convidar.',
            );
        } else {
            const emailAlreadyExists = emailsToInvite.find(
                (email) => email === emailToInvite,
            );

            if (emailAlreadyExists) {
                return Alert.alert(
                    'Convidar amigos',
                    'Esse e-mail ja foi convidado.',
                );
            }

            setEmailsToInvite((prevState) => [...prevState, emailToInvite]);
            setEmailToInvite('');
        }
    }
    
    async function saveTrip(tripId: string) {
        try {
            await tripStorage.save(tripId)
            const tripPath: RelativePathString = `/trip/${tripId}` as RelativePathString;
            router.navigate(tripPath);
        } catch (error) {
            Alert.alert('Ops', 'Ocorreu um erro ao salvar a viagem. Tente novamente mais tarde.')
            console.log(error)
            throw error
        }
    }

    async function createTrip() {
        try {
            setIsCreatingTrip(true)
            const newtrip = await tripServer.create({
                destination,
                starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
                ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
                emails_to_invite: emailsToInvite,
            })
            Alert.alert('Nova viagem', 'Viagem criada com sucesso!')
            saveTrip(newtrip.tripId)
            setIsCreatingTrip(false)
        } catch (error) {
            Alert.alert('Ops', 'Ocorreu um erro ao salvar a viagem. Tente novamente mais tarde.')
            console.log(error)
            throw error
        }
    }

    return (
        <View className="flex-1 items-center justify-center px-5">
            <Image
                source={require('@/assets/logo.png')}
                className="h-8"
                resizeMode="contain"
            />

            <Image source={require('@/assets/bg.png')} className="absolute" />

            <Text className="text-zinc-400 font-regular text-center text-lg mt-3">
                Convide seus amigos e planeje sua{'\n'}próxima viagem
            </Text>

            <View className="w-full bg-zinc-900 p-4 rounded-xl my-8 border border-zinc-800">
                <Input>
                    <MapPin color={colors.zinc[400]} size={20} />
                    <Input.Field
                        placeholder="Para onde?"
                        editable={stepForm === StepForm.TRIP_DETAILS}
                        onChangeText={(value) => setDestination(value)}
                        value={destination}
                    />
                </Input>

                <Input>
                    <CalendarIcon color={colors.zinc[400]} size={20} />
                    <Input.Field
                        placeholder="Quando?"
                        editable={stepForm === StepForm.TRIP_DETAILS}
                        onFocus={() => Keyboard.dismiss()}
                        showSoftInputOnFocus={false}
                        onPress={() =>
                            stepForm === StepForm.TRIP_DETAILS &&
                            setshowModal(MODAL.CALENDAR)
                        }
                        value={selectedDates.formatDatesInText}
                    />
                </Input>

                {stepForm === StepForm.ADD_EMAIL && (
                    <>
                        <View className="border-b py-3 border-zinc-800">
                            <Button
                                variant="secondary"
                                onPress={() =>
                                    setStepForm(StepForm.TRIP_DETAILS)
                                }
                            >
                                <Button.Title>Alterar local/data</Button.Title>
                                <Settings2 color={colors.zinc[200]} size={20} />
                            </Button>
                        </View>

                        <Input>
                            <UserRoundPlus color={colors.zinc[400]} size={20} />
                            <Input.Field
                                placeholder="Quem estará na viagem?"
                                autoCorrect={false}
                                value={emailsToInvite.length > 0 ? `${emailsToInvite.length} pessoa(s) convidada(s)` : ''}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setshowModal(MODAL.GUESTS);
                                }}
                            />
                        </Input>
                    </>
                )}

                <Button onPress={handleNextStepForm} isLoading={isCreatingTrip}>
                    <Button.Title>
                        {stepForm === StepForm.TRIP_DETAILS
                            ? 'Continuar'
                            : 'Confirmar Viagem'}
                    </Button.Title>
                    <ArrowRight color={colors.lime[950]} size={20} />
                </Button>
            </View>

            <Text className="text-zinc-500 font-regular text-center text-base">
                Ao planejar sua viagem pela plann.er você automaticamente
                concorda com nossos{' '}
                <Text className="text-zinc-300 underline">
                    termos de uso e política de privacidade.
                </Text>
            </Text>
            <Modal
                title="Selecione as datas"
                subtitle="Selecione o dia de ida e volta da sua viagem."
                visible={showmodal === MODAL.CALENDAR}
                onClose={() => setshowModal(MODAL.NONE)}
            >
                <View className="gap-4 mt-4">
                    <Calendar
                        minDate={dayjs().toString()}
                        onDayPress={handleSelectDate}
                        markedDates={selectedDates.dates}
                    />

                    <Button onPress={() => setshowModal(MODAL.NONE)}>
                        <Button.Title>Confirmar</Button.Title>
                    </Button>
                </View>
            </Modal>

            <Modal
                title="Selecionar convidados"
                subtitle="Os convidados irão receber e-mail para confirmar sua presença."
                visible={showmodal === MODAL.GUESTS} 
                onClose={() => setshowModal(MODAL.NONE)}
            
            >
                <View className="my-2 flex-wrap gap-2 border-b border-zinc-800 py-5 items-start">
                    {emailsToInvite.length > 0 ? (
                        emailsToInvite.map((email) => (
                            <GuestEmail
                                key={email}
                                email={email}
                                onRemove={() => handleRemoveEmail(email)}
                            />
                        ))
                    ) : (
                        <Text className="text-zinc-500 font-regular text-base">
                            Nenhum convidado adicionado
                        </Text>
                    )}
                </View>
                <View className="gap-4 mt-4">
                    <Input variant="secondary">
                        <AtSign color={colors.zinc[400]} size={20} />
                        <Input.Field
                            placeholder="Digite o e-mail do convidado"
                            keyboardType="email-address"
                            onChangeText={(value) =>
                                setEmailToInvite(value.toLowerCase())
                            }
                            value={emailToInvite}
                            returnKeyType='send'
                            onSubmitEditing={handleAddEmail}
                        />
                    </Input>

                    <Button onPress={handleAddEmail}>
                        <Button.Title>Convidar</Button.Title>
                    </Button>
                </View>
            </Modal>
        </View>
    );
}
