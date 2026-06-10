<?php

namespace App\Tests\Integration\Controller;

use App\Entity\Account;
use App\Entity\Customer;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class CustomerForecastingControllerTest extends WebTestCase
{
    public function testAccountProjectionsReturnsCorrectJsonShape(): void
    {
        $client = static::createClient();

        /** @var EntityManagerInterface $em */
        $em = static::getContainer()->get(EntityManagerInterface::class);

        $user = $em->getRepository(Customer::class)->findOneBy(['username' => 'demo']);
        $this->assertNotNull($user, 'Demo customer fixture must exist in DB');

        // loginUser with the 'customer' firewall (security.yaml defines customer, admin, dev)
        $client->loginUser($user, 'customer');

        $account = $em->getRepository(Account::class)->findOneBy(['name' => 'Checking Account']);
        $this->assertNotNull($account, 'Checking Account fixture must exist in DB');

        $client->request('GET', '/customer/forecasting/account-projections', [
            'account_id' => $account->getId(),
            'period'     => 1,
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('data',    $data);
        $this->assertArrayHasKey('labels',  $data);
        $this->assertArrayHasKey('account', $data);
        $this->assertArrayHasKey('name',    $data['account']);
    }
}
